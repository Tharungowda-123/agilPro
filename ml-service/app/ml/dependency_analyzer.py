from collections import defaultdict, deque
from typing import Dict, List, Set, Tuple


class DependencyAnalyzer:
    """
    Builds task dependency graph, detects cycles, identifies critical path, and
    suggests optimal sequencing for parallel execution.
    """

    def __init__(self, tasks: List[Dict]):
        self.tasks = {task["id"]: task for task in tasks}
        self.graph = self._build_graph(tasks)
        self.in_degree = self._calculate_in_degrees()

    def _build_graph(self, tasks: List[Dict]) -> Dict[str, List[str]]:
        graph = defaultdict(list)
        for task in tasks:
            for dependency in task.get("dependencies", []):
                graph[dependency].append(task["id"])
        return graph

    def _calculate_in_degrees(self) -> Dict[str, int]:
        in_degree = defaultdict(int)
        for node in self.graph:
            for neighbor in self.graph[node]:
                in_degree[neighbor] += 1
        return in_degree

    def detect_cycles(self) -> bool:
        visited: Set[str] = set()
        rec_stack: Set[str] = set()

        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            for neighbor in self.graph.get(node, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            rec_stack.remove(node)
            return False

        for node in self.graph:
            if node not in visited:
                if dfs(node):
                    return True
        return False

    def topological_sort(self) -> List[str]:
        in_degree = self.in_degree.copy()
        queue = deque([node for node in self.tasks if in_degree.get(node, 0) == 0])
        topo_order = []

        while queue:
            current = queue.popleft()
            topo_order.append(current)

            for neighbor in self.graph.get(current, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(topo_order) != len(self.tasks):
            raise ValueError("Cycle detected in dependencies")

        return topo_order

    def critical_path(self) -> List[str]:
        distances = {task_id: float("-inf") for task_id in self.tasks}
        predecessors = {task_id: None for task_id in self.tasks}

        topo_order = self.topological_sort()
        for node in topo_order:
            if distances[node] == float("-inf"):
                distances[node] = self.tasks[node].get("duration", 1)

            for neighbor in self.graph.get(node, []):
                duration = self.tasks[neighbor].get("duration", 1)
                if distances[neighbor] < distances[node] + duration:
                    distances[neighbor] = distances[node] + duration
                    predecessors[neighbor] = node

        end_node = max(distances, key=distances.get)
        path = []
        while end_node:
            path.append(end_node)
            end_node = predecessors[end_node]

        return list(reversed(path))

    def parallel_execution(self) -> List[List[str]]:
        level = defaultdict(int)
        queue = deque([node for node in self.tasks if self.in_degree.get(node, 0) == 0])

        while queue:
            node = queue.popleft()
            for neighbor in self.graph.get(node, []):
                level[neighbor] = max(level[neighbor], level[node] + 1)
                self.in_degree[neighbor] -= 1
                if self.in_degree[neighbor] == 0:
                    queue.append(neighbor)

        parallel_levels = defaultdict(list)
        for node, lvl in level.items():
            parallel_levels[lvl].append(node)

        return [nodes for _, nodes in sorted(parallel_levels.items())]

    def impact_analysis(self, task_id: str) -> List[str]:
        affected = set()

        def dfs(current: str):
            for neighbor in self.graph.get(current, []):
                if neighbor not in affected:
                    affected.add(neighbor)
                    dfs(neighbor)

        dfs(task_id)
        return list(affected)

    def analyze(self) -> Dict[str, any]:
        cycles = self.detect_cycles()
        if cycles:
            return {"error": "Cycle detected; please resolve before scheduling"}

        return {
            "topological_order": self.topological_sort(),
            "critical_path": self.critical_path(),
            "parallel_execution": self.parallel_execution(),
            "impact_analysis": self.impact_analysis(next(iter(self.tasks))),
        }

