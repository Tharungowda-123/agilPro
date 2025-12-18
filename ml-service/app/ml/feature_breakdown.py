import math
import re
from typing import Dict, List, Any

from sentence_transformers import SentenceTransformer

from app.ml.story_analyzer import StoryAnalyzer
from app.utils.logger import get_logger

# Try to import advanced NLP analyzer
try:
    from app.ml.advanced_feature_nlp import nlp_analyzer
    ADVANCED_NLP_AVAILABLE = True
except ImportError:
    ADVANCED_NLP_AVAILABLE = False
    nlp_analyzer = None

logger = get_logger(__name__)


class FeatureBreakdownModel:
    """
    AI-powered feature breakdown using NLP to analyze features and generate stories with tasks.
    """

    def __init__(self):
        self.embedder = SentenceTransformer(StoryAnalyzer.MODEL_NAME)
        self.story_analyzer = StoryAnalyzer()

    def analyze_feature(
        self, title: str, description: str, business_value: str = "", acceptance_criteria: List[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive NLP analysis of a feature.
        Uses advanced NLP if available, falls back to basic analysis.
        Returns: complexity, personas, components, requirements
        """
        acceptance_criteria = acceptance_criteria or []

        # Use advanced NLP if available
        if ADVANCED_NLP_AVAILABLE and nlp_analyzer:
            try:
                nlp_result = nlp_analyzer.analyze_feature(title, description, business_value)
                
                # Map advanced NLP results to expected format
                complexity = self._estimate_feature_complexity(description, acceptance_criteria)
                
                return {
                    "complexity": round(complexity, 1),
                    "complexity_level": self._complexity_level(complexity),
                    "personas": nlp_result.get("personas", []),
                    "components": nlp_result.get("entities", {}).get("data_objects", []),
                    "requirements": nlp_result.get("functional_requirements", []),
                    "intents": nlp_result.get("intents", {}),
                    "entities": nlp_result.get("entities", {}),
                    "integrations": nlp_result.get("integrations", []),
                    "complexity_factors": nlp_result.get("complexity_factors", []),
                    "confidence": nlp_result.get("intents", {}).get("scores", {}).get(
                        nlp_result.get("intents", {}).get("primary", ""), 0.85
                    ),
                    "nlp_analysis": nlp_result,  # Include full NLP analysis
                }
            except Exception as e:
                logger.warning(f"Advanced NLP analysis failed, using fallback: {e}")

        # Fallback to basic analysis
        full_text = f"{title} {description} {business_value}".lower()

        # Analyze complexity
        complexity = self._estimate_feature_complexity(description, acceptance_criteria)

        # Identify personas
        personas = self.identify_personas(description)

        # Extract functional components
        components = self._identify_components(description)

        # Extract requirements
        requirements = self.extract_functional_requirements(description, acceptance_criteria)

        return {
            "complexity": round(complexity, 1),
            "complexity_level": self._complexity_level(complexity),
            "personas": personas,
            "components": components,
            "requirements": requirements,
            "confidence": 0.85,
        }

    def identify_personas(self, description: str) -> List[str]:
        """
        Identify user personas from feature description using NLP patterns.
        """
        text = description.lower()
        personas = []

        # Common persona patterns
        persona_patterns = {
            "admin": ["admin", "administrator", "system admin", "super user"],
            "user": ["user", "customer", "client", "end user", "member"],
            "developer": ["developer", "dev", "engineer", "programmer"],
            "manager": ["manager", "project manager", "team lead", "supervisor"],
            "guest": ["guest", "visitor", "anonymous"],
            "moderator": ["moderator", "editor", "content manager"],
        }

        for persona, patterns in persona_patterns.items():
            if any(pattern in text for pattern in patterns):
                if persona not in personas:
                    personas.append(persona)

        # Default to user if no personas found
        if not personas:
            personas = ["user"]

        return personas

    def extract_functional_requirements(self, description: str, acceptance_criteria: List[str] = None) -> List[str]:
        """
        Extract functional requirements from feature description.
        """
        requirements = []
        text = description.lower()
        acceptance_criteria = acceptance_criteria or []

        # Extract from description
        sentences = re.split(r"[.!?]\s+", description)
        for sentence in sentences:
            sentence = sentence.strip()
            if len(sentence) > 20 and any(
                keyword in sentence.lower()
                for keyword in ["must", "should", "need", "require", "allow", "enable", "support"]
            ):
                requirements.append(sentence)

        # Add acceptance criteria as requirements
        requirements.extend(acceptance_criteria)

        # Extract common functional patterns
        functional_keywords = {
            "authentication": "User authentication and authorization",
            "payment": "Payment processing and transactions",
            "notification": "Notification and messaging system",
            "report": "Reporting and analytics",
            "search": "Search and filtering capabilities",
            "upload": "File upload and management",
            "export": "Data export functionality",
            "integration": "External system integration",
            "dashboard": "Dashboard and visualization",
            "api": "API endpoints and services",
        }

        for keyword, req in functional_keywords.items():
            if keyword in text and req not in requirements:
                requirements.append(req)

        return requirements[:10] if requirements else ["General functional requirements"]

    def generate_stories(
        self, requirements: List[str], personas: List[str], title: str, description: str
    ) -> List[Dict[str, Any]]:
        """
        Generate user stories from requirements and personas.
        """
        stories = []
        total_points = 0

        # Group requirements into story candidates
        story_candidates = self._group_requirements_into_stories(requirements, description)

        for idx, candidate in enumerate(story_candidates):
            # Determine persona for this story
            persona = self._select_persona_for_story(candidate, personas)

            # Create story description
            action = self._extract_action_from_text(candidate)
            benefit = self._extract_benefit_from_text(candidate, description)

            story_description = f"As a {persona}, I want to {action} so that {benefit}"

            # Analyze story complexity
            analysis = self.story_analyzer.analyze_story(title, story_description, [])
            points = analysis.get("estimated_story_points", 5)
            total_points += points

            # Generate acceptance criteria
            criteria = self.generate_acceptance_criteria(candidate, description)

            # Generate tasks for this story
            tasks = self.generate_tasks_for_story(candidate, story_description, analysis)

            stories.append(
                {
                    "title": self._generate_story_title(candidate, idx + 1),
                    "description": story_description,
                    "acceptance_criteria": criteria,
                    "estimated_points": points,
                    "priority": self._determine_priority(points, candidate),
                    "tasks": tasks,
                }
            )

        return stories

    def generate_tasks_for_story(self, story_text: str, story_description: str, analysis: Dict) -> List[Dict[str, Any]]:
        """
        Generate tasks for a story based on complexity breakdown.
        """
        tasks = []
        breakdown = analysis.get("breakdown", {})
        complexity = analysis.get("complexity_score", 5)

        # UI Tasks
        ui_complexity = breakdown.get("ui_complexity", 0) or breakdown.get("ui", 0)
        if ui_complexity > 2:
            tasks.extend(
                [
                    {
                        "title": f"Create {self._extract_ui_component(story_text)} UI",
                        "description": f"Design and implement user interface for {story_text.lower()}",
                        "estimated_hours": max(2, int(ui_complexity * 1.5)),
                        "type": "frontend",
                    },
                    {
                        "title": "Implement form validation",
                        "description": "Add client-side and server-side validation",
                        "estimated_hours": max(1, int(ui_complexity * 0.8)),
                        "type": "frontend",
                    },
                ]
            )

        # Backend Tasks
        backend_complexity = breakdown.get("backend_complexity", 0) or breakdown.get("backend", 0)
        if backend_complexity > 2:
            tasks.extend(
                [
                    {
                        "title": f"Create API endpoint for {self._extract_entity(story_text)}",
                        "description": f"Implement REST API endpoint with proper error handling",
                        "estimated_hours": max(3, int(backend_complexity * 1.2)),
                        "type": "backend",
                    },
                    {
                        "title": "Implement business logic",
                        "description": "Add core business rules and validation",
                        "estimated_hours": max(2, int(backend_complexity * 1.0)),
                        "type": "backend",
                    },
                ]
            )

        # Integration Tasks
        integration_complexity = breakdown.get("integration_complexity", 0) or breakdown.get("integration", 0)
        if integration_complexity > 2:
            tasks.append(
                {
                    "title": "Integrate with external services",
                    "description": "Connect with third-party APIs or services",
                    "estimated_hours": max(4, int(integration_complexity * 1.5)),
                    "type": "integration",
                }
            )

        # Testing Tasks
        testing_complexity = breakdown.get("testing_complexity", 0) or breakdown.get("testing", 0)
        if testing_complexity > 1:
            tasks.append(
                {
                    "title": "Write unit tests",
                    "description": "Create comprehensive unit tests for all components",
                    "estimated_hours": max(2, int(testing_complexity * 1.2)),
                    "type": "testing",
                }
            )
            tasks.append(
                {
                    "title": "Write integration tests",
                    "description": "Test end-to-end workflows",
                    "estimated_hours": max(2, int(testing_complexity * 1.0)),
                    "type": "testing",
                }
            )

        # Default tasks if none generated
        if not tasks:
            tasks = [
                {
                    "title": f"Implement {story_text.lower()}",
                    "description": story_description,
                    "estimated_hours": max(2, int(complexity * 0.8)),
                    "type": "development",
                },
                {
                    "title": "Add tests",
                    "description": "Write tests for the implementation",
                    "estimated_hours": 2,
                    "type": "testing",
                },
            ]

        return tasks

    def break_down_feature(
        self, title: str, description: str, business_value: str = "", acceptance_criteria: List[str] = None
    ) -> Dict[str, Any]:
        """
        Complete feature breakdown: analysis + stories + tasks.
        """
        acceptance_criteria = acceptance_criteria or []

        # Step 1: Analyze feature
        analysis = self.analyze_feature(title, description, business_value, acceptance_criteria)

        # Step 2: Generate stories
        stories = self.generate_stories(analysis["requirements"], analysis["personas"], title, description)

        # Calculate totals
        total_stories = len(stories)
        total_tasks = sum(len(story.get("tasks", [])) for story in stories)
        total_points = sum(story.get("estimated_points", 0) for story in stories)

        return {
            "analysis": analysis,
            "suggested_breakdown": {
                "stories": stories,
                "total_stories": total_stories,
                "total_tasks": total_tasks,
                "total_points": total_points,
            },
            "confidence": analysis.get("confidence", 0.85),
        }

    def _estimate_feature_complexity(self, description: str, acceptance_criteria: List[str]) -> float:
        """Estimate overall feature complexity (0-10 scale)."""
        base_complexity = min(len(description) / 100, 5.0)
        criteria_bonus = len(acceptance_criteria) * 0.5
        keyword_complexity = 0

        complex_keywords = {
            "integration": 2.0,
            "authentication": 1.5,
            "payment": 2.0,
            "real-time": 1.5,
            "analytics": 1.0,
            "report": 1.0,
        }

        text_lower = description.lower()
        for keyword, value in complex_keywords.items():
            if keyword in text_lower:
                keyword_complexity += value

        total = base_complexity + criteria_bonus + keyword_complexity
        return min(10.0, max(1.0, total))

    def _complexity_level(self, score: float) -> str:
        """Convert complexity score to level."""
        if score <= 3:
            return "low"
        if score <= 6:
            return "medium"
        return "high"

    def _identify_components(self, description: str) -> List[str]:
        """Identify functional components from description."""
        sentences = [sentence.strip() for sentence in re.split(r"[.!?]\s+", description) if sentence.strip()]
        # Group related sentences
        components = []
        current_component = ""
        for sentence in sentences:
            if len(sentence) > 30:
                if current_component:
                    components.append(current_component)
                current_component = sentence
            else:
                current_component += " " + sentence if current_component else sentence
        if current_component:
            components.append(current_component)
        return components or [description]

    def _group_requirements_into_stories(self, requirements: List[str], description: str) -> List[str]:
        """Group requirements into logical story candidates."""
        if not requirements:
            # Fallback: break description into components
            return self._identify_components(description)

        # Each requirement can become a story, or group related ones
        stories = []
        for req in requirements[:8]:  # Limit to 8 stories max
            if len(req) > 15:
                stories.append(req)

        return stories[:6] if stories else self._identify_components(description)

    def _select_persona_for_story(self, story_text: str, personas: List[str]) -> str:
        """Select appropriate persona for a story."""
        text = story_text.lower()
        if "admin" in text or "administrator" in text:
            return "admin" if "admin" in personas else personas[0] if personas else "user"
        return personas[0] if personas else "user"

    def _extract_action_from_text(self, text: str) -> str:
        """Extract action verb and object from text."""
        verbs = ["create", "update", "delete", "view", "manage", "configure", "access", "edit", "upload", "download"]
        text_lower = text.lower()
        for verb in verbs:
            if verb in text_lower:
                # Extract object after verb
                parts = text_lower.split(verb, 1)
                if len(parts) > 1:
                    object_part = parts[1].strip().split()[0:3]
                    return f"{verb} {' '.join(object_part)}"
                return f"{verb} items"
        return "perform actions"

    def _extract_benefit_from_text(self, text: str, description: str) -> str:
        """Extract benefit or goal from text."""
        benefit_keywords = {
            "efficient": "I can work more efficiently",
            "quick": "I can complete tasks quickly",
            "easy": "I can use the system easily",
            "secure": "My data is secure",
            "accurate": "I get accurate information",
        }

        text_lower = text.lower()
        for keyword, benefit in benefit_keywords.items():
            if keyword in text_lower:
                return benefit

        # Default benefits based on common patterns
        if "report" in text_lower or "analytics" in text_lower:
            return "I can analyze data and make informed decisions"
        if "authentication" in text_lower or "login" in text_lower:
            return "I can securely access the system"
        if "payment" in text_lower or "transaction" in text_lower:
            return "I can complete transactions securely"
        return "I can achieve my goals efficiently"

    def _generate_story_title(self, text: str, index: int) -> str:
        """Generate a concise story title."""
        # Extract key words
        words = text.split()
        if len(words) <= 5:
            return " ".join(words).title()
        # Take first few meaningful words
        key_words = [w for w in words[:6] if len(w) > 3]
        title = " ".join(key_words[:4]).title()
        return title if title else f"Story {index}"

    def _determine_priority(self, points: int, text: str) -> str:
        """Determine story priority."""
        text_lower = text.lower()
        if "critical" in text_lower or "urgent" in text_lower or points >= 13:
            return "critical"
        if points >= 8 or "important" in text_lower:
            return "high"
        if points >= 5:
            return "medium"
        return "low"

    def _extract_ui_component(self, text: str) -> str:
        """Extract UI component name from text."""
        ui_keywords = {
            "form": "form",
            "page": "page",
            "modal": "modal",
            "dashboard": "dashboard",
            "list": "list view",
            "table": "table",
        }
        text_lower = text.lower()
        for keyword, component in ui_keywords.items():
            if keyword in text_lower:
                return component
        return "interface"

    def _extract_entity(self, text: str) -> str:
        """Extract main entity from text."""
        words = text.split()
        # Look for nouns (capitalized words or common entities)
        entities = [w for w in words if w[0].isupper() and len(w) > 3]
        return entities[0].lower() if entities else "resource"

    def generate_acceptance_criteria(self, story_text: str, description: str) -> List[str]:
        """Generate acceptance criteria for a story."""
        criteria = [
            "System validates all inputs correctly",
            "User receives clear feedback on actions",
            "Error messages are helpful and actionable",
        ]

        text_lower = story_text.lower()
        description_lower = description.lower()

        if "authentication" in text_lower or "login" in text_lower:
            criteria.append("Authentication is secure and follows best practices")
            criteria.append("Password requirements are enforced")
        if "payment" in text_lower or "transaction" in text_lower:
            criteria.append("Payment processing is secure and PCI compliant")
            criteria.append("Transaction history is recorded")
        if "report" in text_lower or "export" in text_lower:
            criteria.append("Report can be exported to CSV/PDF formats")
            criteria.append("Data is accurate and up-to-date")
        if "upload" in text_lower or "file" in text_lower:
            criteria.append("File uploads are validated for type and size")
            criteria.append("Upload progress is visible to user")

        return criteria[:5]  # Limit to 5 criteria

    def _allocate_to_sprints(self, stories: List[Dict], capacity: int = 20) -> List[Dict]:
        allocation = []
        sprint_points = 0
        sprint_stories = []
        sprint_number = 1

        for idx, story in enumerate(stories):
            points = story["estimated_points"]
            if sprint_points + points > capacity:
                allocation.append({"sprint": sprint_number, "stories": [s["title"] for s in sprint_stories]})
                sprint_number += 1
                sprint_points = 0
                sprint_stories = []
            sprint_stories.append(story)
            sprint_points += points

        if sprint_stories:
            allocation.append({"sprint": sprint_number, "stories": [s["title"] for s in sprint_stories]})

        return allocation

