"""
MongoDB connection management.
"""
from typing import Any, Dict, List, Optional

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_client: Optional[MongoClient] = None
_database: Optional[Database] = None


async def connect_to_mongo() -> None:
    """
    Create a MongoClient that can be reused across requests.
    """
    global _client, _database

    if _client is not None:
        return

    logger.info("Connecting to MongoDB at %s", settings.mongodb_uri)
    _client = MongoClient(settings.mongodb_uri)

    default_db = _client.get_default_database()
    if default_db is not None:
        _database = default_db
    else:
        _database = _client[settings.mongodb_db]

    logger.info("MongoDB connection established (db=%s)", _database.name)


async def close_mongo_connection() -> None:
    """
    Close the MongoClient on shutdown.
    """
    global _client

    if _client:
        logger.info("Closing MongoDB connection")
        _client.close()
        _client = None


def get_database() -> Database:
    if _database is None:
        raise RuntimeError("Database connection has not been initialized.")
    return _database


def get_collection(name: str) -> Collection:
    return get_database()[name]


def fetch_training_data(
    collection: str,
    query: Optional[Dict[str, Any]] = None,
    limit: int = 1000,
) -> List[Dict[str, Any]]:
    """
    Convenience helper to fetch training samples from MongoDB.
    """
    cursor = get_collection(collection).find(query or {}).limit(limit)
    return list(cursor)


def fetch_users_by_ids(user_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Fetch user documents from MongoDB by their IDs.
    Converts user IDs to developer dictionaries with required fields.
    """
    from bson import ObjectId
    
    if not user_ids:
        return []
    
    users_collection = get_collection("users")
    developers = []
    
    for user_id in user_ids:
        try:
            # Try ObjectId if it's a valid ObjectId string
            try:
                query = {"_id": ObjectId(user_id)}
            except Exception:
                # If not ObjectId, try as string
                query = {"_id": user_id}
            
            user = users_collection.find_one(query)
            
            if user:
                # Convert user to developer format - only use actual data from database
                # Use 'availability' as capacity (from User model), or 'capacity' if it exists
                # Default to 40 story points if neither is set
                capacity = user.get("capacity") or user.get("availability") or 40
                
                # Always proceed, but use default capacity if missing
                if capacity is None or capacity <= 0:
                    capacity = 40
                    logger.info("User %s missing capacity, using default 40 story points", user_id)
                
                # Get stored metrics (use stored values if available, otherwise calculate)
                current_workload = user.get("currentWorkload") or user.get("current_workload")
                if current_workload is None:
                    # Fallback: calculate from incomplete tasks (but prefer stored value)
                    current_workload = 0
                
                velocity = user.get("velocity")
                if velocity is None:
                    velocity = 0.0
                
                completion_rate = user.get("completionRate") or user.get("completion_rate")
                if completion_rate is None:
                    completion_rate = 0.5
                else:
                    # Convert percentage to decimal (0-1)
                    completion_rate = completion_rate / 100 if completion_rate > 1 else completion_rate
                
                on_time_delivery = user.get("onTimeDelivery") or user.get("on_time_delivery")
                if on_time_delivery is None:
                    on_time_delivery = 0.5
                else:
                    # Convert percentage to decimal (0-1)
                    on_time_delivery = on_time_delivery / 100 if on_time_delivery > 1 else on_time_delivery
                
                quality_score = user.get("qualityScore") or user.get("quality_score")
                if quality_score is None:
                    quality_score = 0.5
                else:
                    # Convert percentage to decimal (0-1)
                    quality_score = quality_score / 100 if quality_score > 1 else quality_score
                
                time_accuracy = user.get("timeAccuracy") or user.get("time_accuracy")
                if time_accuracy is None:
                    time_accuracy = 0.5
                else:
                    # Convert percentage to decimal (0-1)
                    time_accuracy = time_accuracy / 100 if time_accuracy > 1 else time_accuracy
                
                developer = {
                    "user_id": str(user.get("_id", user_id)),
                    "_id": str(user.get("_id", user_id)),
                    "name": user.get("name") or user.get("fullName") or "Unknown",
                    "full_name": user.get("name") or user.get("fullName") or "Unknown",
                    "skills": user.get("skills", []),
                    "capacity": capacity,
                    "current_workload": current_workload,  # Use stored value
                    "velocity": velocity,  # Use stored value
                    "completion_rate": completion_rate,  # Use stored value (converted to 0-1)
                    "time_accuracy": time_accuracy,  # Use stored value (converted to 0-1)
                    "collaboration_index": user.get("collaborationIndex") or user.get("collaboration_index") or 0.5,
                    "on_time_delivery": on_time_delivery,  # Use stored value (converted to 0-1)
                    "quality_score": quality_score,  # Use stored value (converted to 0-1)
                    "complexity_handled": user.get("complexityHandled") or user.get("complexity_handled") or "medium",
                    "completed_similar_tasks": user.get("completedSimilarTasks") or user.get("completed_similar_tasks") or 0,
                    "time_tracking_consistency": user.get("timeTrackingConsistency") or user.get("time_tracking_consistency") or 0.5,
                    "time_logging_variance": user.get("timeLoggingVariance") or user.get("time_logging_variance") or 0.3,
                    "on_vacation": user.get("onVacation") or user.get("on_vacation") or False,
                }
                developers.append(developer)
            else:
                # User not found - skip (don't create dummy data)
                logger.warning("User %s not found in database, skipping", user_id)
        except Exception as e:
            logger.warning("Error fetching user %s: %s, skipping", user_id, e)
            # Don't create dummy data on error
    
    return developers



