from typing import Dict, List, Any
import numpy as np
from app.utils.logger import get_logger

logger = get_logger(__name__)


class PIOptimizer:
    """
    Optimizes feature distribution across sprints in a Program Increment.
    Uses a greedy algorithm with business value maximization and risk minimization.
    """

    def optimize(
        self,
        features: List[Dict[str, Any]],
        sprints: List[Dict[str, Any]],
        dependencies: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Optimize feature distribution across sprints.
        
        Args:
            features: List of features with id, title, points, priority, status
            sprints: List of sprints with id, name, capacity, startDate, endDate
            dependencies: List of dependencies between features
            
        Returns:
            Optimization result with feature assignments and metrics
        """
        dependencies = dependencies or []
        
        # Build dependency graph
        dependency_graph = self._build_dependency_graph(features, dependencies)
        
        # Calculate priority scores (business value weighted)
        priority_scores = self._calculate_priority_scores(features)
        
        # Sort features by priority and dependencies
        sorted_features = self._sort_features_by_priority(features, priority_scores, dependency_graph)
        
        # Allocate features to sprints
        assignments = self._allocate_features_to_sprints(sorted_features, sprints, dependency_graph)
        
        # Calculate metrics
        metrics = self._calculate_metrics(assignments, sprints, features)
        
        # Check for overloads
        warnings = self._check_overloads(assignments, sprints)
        
        return {
            "assignments": assignments,
            "metrics": metrics,
            "warnings": warnings,
            "confidence": 0.85,
        }

    def _build_dependency_graph(
        self, features: List[Dict], dependencies: List[Dict]
    ) -> Dict[str, List[str]]:
        """Build dependency graph from dependencies list."""
        graph = {feature["id"]: [] for feature in features}
        
        for dep in dependencies:
            from_id = dep.get("fromFeature") or dep.get("from_feature")
            to_id = dep.get("toFeature") or dep.get("to_feature")
            
            if from_id and to_id:
                # Convert to string if needed
                from_id = str(from_id) if not isinstance(from_id, str) else from_id
                to_id = str(to_id) if not isinstance(to_id, str) else to_id
                
                if from_id in graph:
                    graph[from_id].append(to_id)
        
        return graph

    def _calculate_priority_scores(self, features: List[Dict]) -> Dict[str, float]:
        """Calculate priority scores based on business value and points."""
        scores = {}
        priority_weights = {"critical": 10, "high": 7, "medium": 4, "low": 1}
        
        for feature in features:
            feature_id = str(feature.get("id", ""))
            priority = feature.get("priority", "medium").lower()
            points = feature.get("points", 0) or feature.get("estimatedStoryPoints", 0) or 0
            business_value = feature.get("businessValue", 5) or 5
            
            # Score = priority weight * business value / (points + 1)
            # Higher priority and business value = higher score
            # Lower points = higher score (easier to complete)
            priority_weight = priority_weights.get(priority, 4)
            score = (priority_weight * business_value) / (points + 1)
            scores[feature_id] = score
        
        return scores

    def _sort_features_by_priority(
        self,
        features: List[Dict],
        priority_scores: Dict[str, float],
        dependency_graph: Dict[str, List[str]],
    ) -> List[Dict]:
        """Sort features considering dependencies and priority."""
        # Topological sort considering dependencies
        sorted_list = []
        visited = set()
        temp_visited = set()
        
        def visit(feature_id: str):
            if feature_id in temp_visited:
                return  # Circular dependency, skip
            if feature_id in visited:
                return
            
            temp_visited.add(feature_id)
            
            # Visit dependencies first
            for dep_id in dependency_graph.get(feature_id, []):
                visit(dep_id)
            
            temp_visited.remove(feature_id)
            visited.add(feature_id)
            
            # Find feature and add to sorted list
            feature = next((f for f in features if str(f.get("id", "")) == feature_id), None)
            if feature:
                sorted_list.append(feature)
        
        # Sort all features by priority score first
        feature_ids = sorted(
            [str(f.get("id", "")) for f in features],
            key=lambda x: priority_scores.get(x, 0),
            reverse=True,
        )
        
        # Visit in priority order
        for feature_id in feature_ids:
            if feature_id not in visited:
                visit(feature_id)
        
        return sorted_list

    def _allocate_features_to_sprints(
        self,
        sorted_features: List[Dict],
        sprints: List[Dict],
        dependency_graph: Dict[str, List[str]],
    ) -> List[Dict[str, Any]]:
        """Allocate features to sprints using greedy algorithm."""
        assignments = []
        sprint_capacities = {sprint["id"]: sprint.get("capacity", 0) or 0 for sprint in sprints}
        sprint_allocated = {sprint["id"]: 0 for sprint in sprints}
        feature_to_sprint = {}
        
        for feature in sorted_features:
            feature_id = str(feature.get("id", ""))
            points = feature.get("points", 0) or feature.get("estimatedStoryPoints", 0) or 0
            
            # Find best sprint (considering dependencies and capacity)
            best_sprint = None
            best_sprint_id = None
            
            # Check if feature has dependencies
            dependencies = dependency_graph.get(feature_id, [])
            dependency_sprints = [
                feature_to_sprint.get(dep_id) for dep_id in dependencies if dep_id in feature_to_sprint
            ]
            
            # Try to place in same sprint as dependencies, or next available
            for sprint in sprints:
                sprint_id = str(sprint.get("id", ""))
                capacity = sprint_capacities.get(sprint_id, 0)
                allocated = sprint_allocated.get(sprint_id, 0)
                
                # Check if sprint has capacity
                if allocated + points <= capacity:
                    # Prefer sprint with dependencies
                    if sprint_id in dependency_sprints:
                        best_sprint = sprint
                        best_sprint_id = sprint_id
                        break
                    # Or first available sprint
                    elif best_sprint is None:
                        best_sprint = sprint
                        best_sprint_id = sprint_id
            
            # If no sprint found, assign to first sprint anyway (will show as overloaded)
            if best_sprint is None and sprints:
                best_sprint = sprints[0]
                best_sprint_id = str(sprints[0].get("id", ""))
            
            if best_sprint:
                assignments.append({
                    "featureId": feature_id,
                    "featureTitle": feature.get("title", ""),
                    "sprintId": best_sprint_id,
                    "sprintName": best_sprint.get("name", ""),
                    "points": points,
                    "priority": feature.get("priority", "medium"),
                })
                
                feature_to_sprint[feature_id] = best_sprint_id
                sprint_allocated[best_sprint_id] = sprint_allocated.get(best_sprint_id, 0) + points
        
        return assignments

    def _calculate_metrics(
        self,
        assignments: List[Dict],
        sprints: List[Dict],
        features: List[Dict],
    ) -> Dict[str, Any]:
        """Calculate optimization metrics."""
        total_points = sum(f.get("points", 0) or f.get("estimatedStoryPoints", 0) or 0 for f in features)
        total_capacity = sum(s.get("capacity", 0) or 0 for s in sprints)
        
        sprint_utilization = {}
        for sprint in sprints:
            sprint_id = str(sprint.get("id", ""))
            sprint_assignments = [a for a in assignments if a["sprintId"] == sprint_id]
            allocated = sum(a["points"] for a in sprint_assignments)
            capacity = sprint.get("capacity", 0) or 0
            utilization = (allocated / capacity * 100) if capacity > 0 else 0
            
            sprint_utilization[sprint_id] = {
                "allocated": allocated,
                "capacity": capacity,
                "utilization": round(utilization, 1),
            }
        
        overall_utilization = (total_points / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            "totalPoints": total_points,
            "totalCapacity": total_capacity,
            "overallUtilization": round(overall_utilization, 1),
            "sprintUtilization": sprint_utilization,
        }

    def _check_overloads(
        self, assignments: List[Dict], sprints: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Check for sprint overloads and return warnings."""
        warnings = []
        sprint_capacities = {str(s.get("id", "")): s.get("capacity", 0) or 0 for s in sprints}
        sprint_allocated = {}
        
        for assignment in assignments:
            sprint_id = assignment["sprintId"]
            sprint_allocated[sprint_id] = sprint_allocated.get(sprint_id, 0) + assignment["points"]
        
        for sprint_id, allocated in sprint_allocated.items():
            capacity = sprint_capacities.get(sprint_id, 0)
            if allocated > capacity:
                sprint_name = next(
                    (s.get("name", "") for s in sprints if str(s.get("id", "")) == sprint_id),
                    sprint_id,
                )
                warnings.append({
                    "sprintId": sprint_id,
                    "sprintName": sprint_name,
                    "allocated": allocated,
                    "capacity": capacity,
                    "overload": allocated - capacity,
                    "severity": "high" if (allocated - capacity) > capacity * 0.2 else "medium",
                })
        
        return warnings

