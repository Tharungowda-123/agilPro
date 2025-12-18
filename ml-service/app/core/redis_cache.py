"""
Redis Cache Utilities for ML Service
Provides caching decorators and utilities for ML predictions
"""
import redis
import json
import hashlib
from functools import wraps
from typing import Any, Callable, Optional
import os
from app.core.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Redis client
try:
    redis_client = redis.Redis(
        host=os.getenv('REDIS_HOST', 'localhost'),
        port=int(os.getenv('REDIS_PORT', 6379)),
        password=os.getenv('REDIS_PASSWORD'),
        db=0,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
    )
    # Test connection
    redis_client.ping()
    logger.info("✓ Redis connected for ML service")
except Exception as e:
    logger.warning(f"Redis connection failed, continuing without cache: {e}")
    redis_client = None


def cache_prediction(key_prefix: str, ttl: int = 300):
    """
    Decorator to cache ML predictions.

    Usage:
    @cache_prediction('ml:task-assign', 600)
    async def get_recommendations(task_data, team_members):
        # ML logic
        return recommendations
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not redis_client:
                # Redis not available, skip caching
                return await func(*args, **kwargs)

            # Generate cache key from function arguments
            try:
                args_str = json.dumps(
                    {
                        'args': str(args),
                        'kwargs': {k: str(v) for k, v in kwargs.items()},
                    },
                    sort_keys=True,
                )

                # Hash for shorter key
                args_hash = hashlib.md5(args_str.encode()).hexdigest()
                cache_key = f"{key_prefix}:{args_hash}"

                # Try to get from cache
                try:
                    cached = redis_client.get(cache_key)
                    if cached:
                        logger.debug(f"Cache HIT: {cache_key}")
                        return json.loads(cached)
                except Exception as e:
                    logger.warning(f"Cache get error: {e}")

                # Cache miss - call function
                logger.debug(f"Cache MISS: {cache_key}")
                result = await func(*args, **kwargs)

                # Store in cache
                try:
                    redis_client.setex(
                        cache_key, ttl, json.dumps(result, default=str)
                    )
                except Exception as e:
                    logger.warning(f"Cache set error: {e}")

                return result
            except Exception as e:
                logger.error(f"Cache decorator error: {e}")
                # Fallback to function call
                return await func(*args, **kwargs)

        return wrapper

    return decorator


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate all cache keys matching pattern.

    Args:
        pattern: Redis key pattern (e.g., 'ml:task-assign:*')

    Returns:
        Number of keys deleted
    """
    if not redis_client:
        return 0

    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} cache keys matching: {pattern}")
        return len(keys)
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        return 0


# Cache utility class
class CacheUtils:
    """Utility class for Redis cache operations."""

    @staticmethod
    def get(key: str) -> Optional[Any]:
        """Get value from cache."""
        if not redis_client:
            return None

        try:
            data = redis_client.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.warning(f"Cache get error for {key}: {e}")
            return None

    @staticmethod
    def set(key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL."""
        if not redis_client:
            return False

        try:
            redis_client.setex(key, ttl, json.dumps(value, default=str))
            return True
        except Exception as e:
            logger.warning(f"Cache set error for {key}: {e}")
            return False

    @staticmethod
    def delete(key: str) -> bool:
        """Delete key from cache."""
        if not redis_client:
            return False

        try:
            redis_client.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error for {key}: {e}")
            return False

    @staticmethod
    def exists(key: str) -> bool:
        """Check if key exists in cache."""
        if not redis_client:
            return False

        try:
            return redis_client.exists(key) == 1
        except Exception as e:
            logger.warning(f"Cache exists error for {key}: {e}")
            return False

    @staticmethod
    def ttl(key: str) -> int:
        """Get TTL for key."""
        if not redis_client:
            return -1

        try:
            return redis_client.ttl(key)
        except Exception as e:
            logger.warning(f"Cache TTL error for {key}: {e}")
            return -1


cache_utils = CacheUtils()

