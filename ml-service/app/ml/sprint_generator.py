from typing import Dict, List, Any
import time
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SprintAutoGenerator:
    """
    Auto-generates sprint plans instantly by selecting optimal stories and assigning tasks.
    Algorithm: Priority-based selection + Skill matching + Workload balancing
    """

    def generate_plan(
        self,
        sprint_id: str,
        capacity: int,
        team_members: List[Dict[str, Any]],
        available_stories: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Generate complete sprint plan in < 5 seconds.
        
        Args:
            sprint_id: Sprint identifier
            capacity: Sprint capacity in story points
            team_members: List of team members with skills, capacity, workload
            available_stories: List of available stories from backlog
            
        Returns:
            Generated plan with selected stories, task assignments, and metrics
        """
        start_time = time.time()
        
        # Step 1: Filter and sort stories by priority
        filtered_stories = self._filter_by_priority(available_stories)
        
        # Step 2: Select stories fitting capacity (considering dependencies)
        selected_stories = self._select_stories_for_capacity(filtered_stories, capacity)
        
        # Step 3: Generate tasks for each story
        stories_with_tasks = []
        for story in selected_stories:
            tasks = self._generate_tasks_for_story(story, team_members)
            stories_with_tasks.append({
                "story": story,
                "tasks": tasks,
            })
        
        # Step 4: Assign tasks by skill + workload
        assigned_plan = self._assign_tasks_to_team(stories_with_tasks, team_members)
        
        # Step 5: Balance workload across team
        balanced_plan = self._balance_workload(assigned_plan, team_members)
        
        # Step 6: Calculate metrics
        total_points = sum(s["story"].get("storyPoints", 0) or s["story"].get("points", 0) for s in balanced_plan)
        capacity_utilization = (total_points / capacity * 100) if capacity > 0 else 0
        
        # Calculate team workload
        team_workload = self._calculate_team_workload(balanced_plan, team_members)
        
        # Predict completion probability
        predicted_completion = self._predict_completion_probability(balanced_plan, team_members, capacity)
        
        generation_time = time.time() - start_time
        
        return {
            "generated_plan": {
                "selected_stories": balanced_plan,
                "total_points": total_points,
                "capacity_utilization": round(capacity_utilization, 1),
                "team_workload": team_workload,
                "predicted_completion": round(predicted_completion, 1),
                "generation_time": f"{generation_time:.2f} seconds",
            },
        }

    def _filter_by_priority(self, stories: List[Dict]) -> List[Dict]:
        """Filter and sort stories by priority."""
        priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        
        filtered = [s for s in stories if s.get("status") in ["backlog", "ready", None]]
        
        sorted_stories = sorted(
            filtered,
            key=lambda s: priority_order.get(s.get("priority", "medium").lower(), 2),
            reverse=True,
        )
        
        return sorted_stories

    def _select_stories_for_capacity(self, stories: List[Dict], capacity: int) -> List[Dict]:
        """Select stories that fit within capacity, respecting dependencies."""
        selected = []
        used_capacity = 0
        selected_ids = set()
        
        # Build dependency graph
        dependency_map = {}
        for story in stories:
            story_id = str(story.get("id", "") or story.get("_id", ""))
            dependencies = story.get("dependencies", []) or []
            dependency_map[story_id] = [str(dep.get("id", dep) if isinstance(dep, dict) else dep) for dep in dependencies]
        
        # Select stories in dependency order
        for story in stories:
            story_id = str(story.get("id", "") or story.get("_id", ""))
            story_points = story.get("storyPoints", 0) or story.get("points", 0) or 0
            
            # Check if dependencies are satisfied
            dependencies = dependency_map.get(story_id, [])
            if dependencies:
                deps_satisfied = all(dep_id in selected_ids for dep_id in dependencies)
                if not deps_satisfied:
                    continue  # Skip if dependencies not met
            
            # Check capacity
            if used_capacity + story_points <= capacity:
                selected.append(story)
                selected_ids.add(story_id)
                used_capacity += story_points
            else:
                # Try to fit if close to capacity (within 20%)
                if used_capacity + story_points <= capacity * 1.2:
                    selected.append(story)
                    selected_ids.add(story_id)
                    used_capacity += story_points
                    break  # Stop after this to avoid overloading
        
        return selected

    def _generate_tasks_for_story(self, story: Dict, team_members: List[Dict]) -> List[Dict]:
        """Generate tasks for a story based on complexity and team skills."""
        story_points = story.get("storyPoints", 0) or story.get("points", 0) or 0
        description = story.get("description", "") or ""
        title = story.get("title", "") or ""
        
        tasks = []
        
        # Determine task types needed based on story
        text_lower = (title + " " + description).lower()
        
        # UI tasks
        if any(keyword in text_lower for keyword in ["ui", "interface", "form", "page", "view", "display"]):
            tasks.append({
                "title": f"Create UI for {title[:30]}",
                "description": f"Design and implement user interface components",
                "estimated_hours": max(4, int(story_points * 1.5)),
                "type": "frontend",
                "required_skills": ["react", "ui", "frontend"],
            })
        
        # Backend tasks
        if any(keyword in text_lower for keyword in ["api", "endpoint", "service", "backend", "server", "database"]):
            tasks.append({
                "title": f"Implement backend for {title[:30]}",
                "description": f"Create API endpoints and business logic",
                "estimated_hours": max(6, int(story_points * 2)),
                "type": "backend",
                "required_skills": ["node", "api", "backend"],
            })
        
        # Integration tasks
        if any(keyword in text_lower for keyword in ["integrate", "connect", "external", "third-party"]):
            tasks.append({
                "title": f"Integration for {title[:30]}",
                "description": f"Integrate with external services or APIs",
                "estimated_hours": max(4, int(story_points * 1.5)),
                "type": "integration",
                "required_skills": ["integration", "api"],
            })
        
        # Testing tasks (always include)
        tasks.append({
            "title": f"Tests for {title[:30]}",
            "description": f"Write unit and integration tests",
            "estimated_hours": max(2, int(story_points * 0.8)),
            "type": "testing",
            "required_skills": ["testing", "qa"],
        })
        
        # Default task if none generated
        if not tasks:
            tasks.append({
                "title": f"Implement {title[:40]}",
                "description": description[:200] or f"Complete implementation for {title}",
                "estimated_hours": max(4, int(story_points * 1.2)),
                "type": "development",
                "required_skills": [],
            })
        
        return tasks

    def _assign_tasks_to_team(
        self, stories_with_tasks: List[Dict], team_members: List[Dict]
    ) -> List[Dict]:
        """Assign tasks to team members based on skills and workload."""
        assigned_plan = []
        
        for story_data in stories_with_tasks:
            story = story_data["story"]
            tasks = story_data["tasks"]
            
            assigned_tasks = []
            for task in tasks:
                # Find best team member for this task
                best_member = self._find_best_member_for_task(task, team_members)
                
                if best_member:
                    assigned_tasks.append({
                        "task": task,
                        "assigned_to": best_member.get("id") or best_member.get("_id"),
                        "assigned_to_name": best_member.get("name", "Unknown"),
                        "reason": self._get_assignment_reason(task, best_member),
                    })
                else:
                    # Assign to first available member
                    if team_members:
                        assigned_tasks.append({
                            "task": task,
                            "assigned_to": team_members[0].get("id") or team_members[0].get("_id"),
                            "assigned_to_name": team_members[0].get("name", "Unknown"),
                            "reason": "Available team member",
                        })
            
            assigned_plan.append({
                "story": story,
                "tasks": assigned_tasks,
            })
        
        return assigned_plan

    def _find_best_member_for_task(self, task: Dict, team_members: List[Dict]) -> Dict:
        """Find the best team member for a task based on skills and workload."""
        required_skills = task.get("required_skills", []) or []
        task_hours = task.get("estimated_hours", 0) or 0
        
        if not team_members:
            return None
        
        best_member = None
        best_score = -1
        
        for member in team_members:
            # Calculate skill match score
            member_skills = [s.lower() for s in (member.get("skills", []) or [])]
            skill_match = 0
            if required_skills:
                matches = sum(1 for skill in required_skills if any(ms in skill.lower() or skill.lower() in ms for ms in member_skills))
                skill_match = matches / len(required_skills) if required_skills else 0.5
            else:
                skill_match = 0.5  # Neutral if no required skills
            
            # Calculate workload score (lower workload = higher score)
            current_workload = member.get("currentWorkload", 0) or member.get("current_workload", 0) or 0
            capacity = member.get("capacity", 40) or member.get("availability", 40) or 40
            workload_ratio = current_workload / capacity if capacity > 0 else 0
            workload_score = 1 - min(workload_ratio, 1)  # Inverse: lower workload = higher score
            
            # Combined score
            score = (skill_match * 0.6) + (workload_score * 0.4)
            
            if score > best_score:
                best_score = score
                best_member = member
        
        return best_member

    def _get_assignment_reason(self, task: Dict, member: Dict) -> str:
        """Generate human-readable reason for task assignment."""
        required_skills = task.get("required_skills", []) or []
        member_skills = [s.lower() for s in (member.get("skills", []) or [])]
        
        if required_skills:
            matching_skills = [s for s in required_skills if any(ms in s.lower() or s.lower() in ms for ms in member_skills)]
            if matching_skills:
                return f"Has required skills: {', '.join(matching_skills[:2])}"
        
        workload = member.get("currentWorkload", 0) or member.get("current_workload", 0) or 0
        if workload < 20:
            return "Low current workload"
        
        return "Best available team member"

    def _balance_workload(self, plan: List[Dict], team_members: List[Dict]) -> List[Dict]:
        """Balance workload across team members."""
        # Calculate current workload per member
        member_workload = {str(m.get("id", m.get("_id", ""))): m.get("currentWorkload", 0) or m.get("current_workload", 0) or 0 for m in team_members}
        
        # Calculate new workload from plan
        for story_data in plan:
            for task_data in story_data["tasks"]:
                member_id = str(task_data.get("assigned_to", ""))
                task_hours = task_data["task"].get("estimated_hours", 0) or 0
                if member_id in member_workload:
                    member_workload[member_id] += task_hours
        
        # Find overloaded members and redistribute
        avg_workload = sum(member_workload.values()) / len(member_workload) if member_workload else 0
        
        # Simple rebalancing: if a member is >20% above average, try to move tasks
        for story_data in plan:
            for task_data in story_data["tasks"]:
                member_id = str(task_data.get("assigned_to", ""))
                if member_id in member_workload:
                    if member_workload[member_id] > avg_workload * 1.2:
                        # Try to find a less loaded member
                        less_loaded = min(
                            team_members,
                            key=lambda m: member_workload.get(str(m.get("id", m.get("_id", ""))), 0),
                        )
                        less_loaded_id = str(less_loaded.get("id", less_loaded.get("_id", "")))
                        
                        # Check if less loaded member has required skills
                        required_skills = task_data["task"].get("required_skills", []) or []
                        less_loaded_skills = [s.lower() for s in (less_loaded.get("skills", []) or [])]
                        
                        if not required_skills or any(
                            skill.lower() in less_loaded_skills or any(ls in skill.lower() for ls in less_loaded_skills)
                            for skill in required_skills
                        ):
                            # Reassign
                            task_data["assigned_to"] = less_loaded_id
                            task_data["assigned_to_name"] = less_loaded.get("name", "Unknown")
                            task_data["reason"] = "Rebalanced workload"
                            
                            # Update workload tracking
                            task_hours = task_data["task"].get("estimated_hours", 0) or 0
                            member_workload[member_id] -= task_hours
                            member_workload[less_loaded_id] = member_workload.get(less_loaded_id, 0) + task_hours
        
        return plan

    def _calculate_team_workload(
        self, plan: List[Dict], team_members: List[Dict]
    ) -> List[Dict[str, Any]]:
        """Calculate workload for each team member before and after plan."""
        workload_data = []
        
        # Initial workload
        initial_workload = {
            str(m.get("id", m.get("_id", ""))): m.get("currentWorkload", 0) or m.get("current_workload", 0) or 0
            for m in team_members
        }
        
        # Calculate new workload from plan
        new_workload = initial_workload.copy()
        for story_data in plan:
            for task_data in story_data["tasks"]:
                member_id = str(task_data.get("assigned_to", ""))
                task_hours = task_data["task"].get("estimated_hours", 0) or 0
                if member_id in new_workload:
                    new_workload[member_id] += task_hours
        
        # Build workload report
        for member in team_members:
            member_id = str(member.get("id", member.get("_id", "")))
            before = initial_workload.get(member_id, 0)
            after = new_workload.get(member_id, 0)
            capacity = member.get("capacity", 40) or member.get("availability", 40) or 40
            utilization = (after / capacity * 100) if capacity > 0 else 0
            
            workload_data.append({
                "member": member.get("name", "Unknown"),
                "member_id": member_id,
                "before": before,
                "after": after,
                "utilization": round(utilization, 1),
            })
        
        return workload_data

    def _predict_completion_probability(
        self, plan: List[Dict], team_members: List[Dict], capacity: int
    ) -> float:
        """Predict completion probability based on capacity, workload, and historical data."""
        total_points = sum(s["story"].get("storyPoints", 0) or s["story"].get("points", 0) for s in plan)
        
        # Base probability from capacity utilization
        capacity_ratio = total_points / capacity if capacity > 0 else 1
        if capacity_ratio <= 0.8:
            base_probability = 0.95
        elif capacity_ratio <= 1.0:
            base_probability = 0.85
        elif capacity_ratio <= 1.2:
            base_probability = 0.70
        else:
            base_probability = 0.50
        
        # Adjust based on team workload
        avg_utilization = 0
        if team_members:
            utilizations = []
            for member in team_members:
                capacity_member = member.get("capacity", 40) or member.get("availability", 40) or 40
                current_workload = member.get("currentWorkload", 0) or member.get("current_workload", 0) or 0
                
                # Calculate new workload from plan
                member_id = str(member.get("id", member.get("_id", "")))
                for story_data in plan:
                    for task_data in story_data["tasks"]:
                        if str(task_data.get("assigned_to", "")) == member_id:
                            task_hours = task_data["task"].get("estimated_hours", 0) or 0
                            current_workload += task_hours
                
                utilization = (current_workload / capacity_member * 100) if capacity_member > 0 else 0
                utilizations.append(utilization)
            
            avg_utilization = sum(utilizations) / len(utilizations) if utilizations else 0
        
        # Adjust probability based on utilization
        if avg_utilization > 100:
            base_probability *= 0.7  # Overloaded
        elif avg_utilization > 90:
            base_probability *= 0.85  # High utilization
        elif avg_utilization < 50:
            base_probability *= 1.1  # Underutilized (slight boost)
        
        # Adjust based on historical velocity if available
        avg_velocity = 0
        velocity_count = 0
        for member in team_members:
            velocity = member.get("velocity", 0) or 0
            if velocity > 0:
                avg_velocity += velocity
                velocity_count += 1
        
        if velocity_count > 0:
            avg_velocity = avg_velocity / velocity_count
            # If team has good velocity, boost probability
            if avg_velocity > 30:
                base_probability *= 1.05
        
        return min(95, max(50, base_probability * 100))  # Clamp between 50-95%

