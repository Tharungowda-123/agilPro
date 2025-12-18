"""
Advanced Feature NLP Analyzer
Uses spaCy and transformers for deep text analysis of feature descriptions
"""
import logging
from typing import Dict, List, Tuple

try:
    import spacy
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    SPACY_AVAILABLE = True
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    TRANSFORMERS_AVAILABLE = False
    logging.warning("spaCy or transformers not available. NLP features will be limited.")

from app.utils.logger import get_logger

logger = get_logger(__name__)


class AdvancedFeatureNLP:
    """
    Advanced NLP analyzer for feature descriptions.
    Uses spaCy for NER and dependency parsing, transformers for intent classification.
    """

    def __init__(self):
        """Initialize NLP models."""
        self.nlp = None
        self.classifier = None
        self.intent_categories = [
            "Authentication",
            "User Management",
            "CRUD Operations",
            "Payment Processing",
            "Email Notifications",
            "File Management",
            "Reporting",
            "API Integration",
            "Data Analytics",
            "Search",
        ]

        # Try to load spaCy
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_lg")
                logger.info("Loaded spaCy model: en_core_web_lg")
            except OSError:
                try:
                    self.nlp = spacy.load("en_core_web_sm")
                    logger.warning("Loaded smaller spaCy model: en_core_web_sm")
                except OSError:
                    logger.warning("spaCy model not found. Using fallback NLP.")
                    self.nlp = None

        # Try to load transformer classifier
        if TRANSFORMERS_AVAILABLE:
            try:
                self.classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=0 if torch.cuda.is_available() else -1,
                )
                logger.info("Loaded transformer classifier: facebook/bart-large-mnli")
            except Exception as e:
                logger.warning(f"Failed to load transformer classifier: {e}")
                self.classifier = None

    def analyze_feature(
        self, title: str, description: str, business_value: str = ""
    ) -> Dict:
        """
        Perform comprehensive NLP analysis on feature.

        Args:
            title: Feature title
            description: Feature description
            business_value: Business value description

        Returns:
            Dictionary with analysis results
        """
        # Combine all text
        full_text = f"{title}. {description}. {business_value}"

        # Process with spaCy if available
        if self.nlp:
            doc = self.nlp(full_text)
        else:
            doc = None

        # Extract entities
        entities = self._extract_entities(doc, full_text) if doc else self._extract_entities_fallback(full_text)

        # Classify intents
        intents = self._classify_intents(full_text)

        # Extract requirements
        requirements = self._extract_requirements(doc, full_text) if doc else self._extract_requirements_fallback(full_text)

        # Identify user personas
        personas = self._identify_personas(doc, full_text) if doc else self._identify_personas_fallback(full_text)

        # Extract technical dependencies
        integrations = self._identify_integrations(full_text)

        # Analyze complexity factors
        complexity_factors = self._analyze_complexity(doc, entities, full_text) if doc else self._analyze_complexity_fallback(entities, full_text)

        return {
            "entities": entities,
            "intents": intents,
            "functional_requirements": requirements["functional"],
            "non_functional_requirements": requirements["non_functional"],
            "personas": personas,
            "integrations": integrations,
            "complexity_factors": complexity_factors,
        }

    def _extract_entities(self, doc, text: str) -> Dict[str, List[str]]:
        """Extract named entities using spaCy NER."""
        entities = {
            "technologies": [],
            "user_roles": [],
            "actions": [],
            "data_objects": [],
        }

        # Technology keywords
        tech_keywords = [
            "react",
            "node",
            "mongodb",
            "jwt",
            "api",
            "rest",
            "graphql",
            "redis",
            "aws",
            "azure",
            "docker",
            "kubernetes",
            "postgresql",
            "mysql",
            "firebase",
            "sendgrid",
            "stripe",
            "javascript",
            "typescript",
            "python",
            "java",
            "spring",
            "express",
        ]

        # Extract entities
        for ent in doc.ents:
            if ent.label_ == "PRODUCT" or ent.text.lower() in tech_keywords:
                entities["technologies"].append(ent.text)
            elif ent.label_ == "PERSON" or ent.text.lower() in [
                "user",
                "admin",
                "customer",
                "manager",
            ]:
                entities["user_roles"].append(ent.text)

        # Extract verbs (actions)
        for token in doc:
            if token.pos_ == "VERB" and token.text.lower() in [
                "create",
                "read",
                "update",
                "delete",
                "login",
                "register",
                "upload",
                "download",
                "send",
                "receive",
                "notify",
                "manage",
                "authenticate",
                "authorize",
                "validate",
                "process",
                "search",
                "filter",
                "export",
                "import",
            ]:
                entities["actions"].append(token.text)

        # Extract nouns (data objects)
        for chunk in doc.noun_chunks:
            if chunk.root.pos_ == "NOUN":
                entities["data_objects"].append(chunk.text)

        # Remove duplicates
        for key in entities:
            entities[key] = list(set(entities[key]))

        return entities

    def _extract_entities_fallback(self, text: str) -> Dict[str, List[str]]:
        """Fallback entity extraction without spaCy."""
        entities = {
            "technologies": [],
            "user_roles": [],
            "actions": [],
            "data_objects": [],
        }

        text_lower = text.lower()

        # Technology keywords
        tech_keywords = [
            "react",
            "node",
            "mongodb",
            "jwt",
            "api",
            "rest",
            "graphql",
            "redis",
            "aws",
            "azure",
            "docker",
            "kubernetes",
        ]

        for keyword in tech_keywords:
            if keyword in text_lower:
                entities["technologies"].append(keyword.title())

        # User roles
        role_keywords = ["user", "admin", "customer", "manager", "developer"]
        for role in role_keywords:
            if role in text_lower:
                entities["user_roles"].append(role.title())

        # Actions
        action_keywords = [
            "create",
            "read",
            "update",
            "delete",
            "login",
            "register",
            "upload",
            "download",
        ]
        for action in action_keywords:
            if action in text_lower:
                entities["actions"].append(action)

        return entities

    def _classify_intents(self, text: str) -> Dict:
        """Classify the primary intent of the feature."""
        if self.classifier:
            try:
                result = self.classifier(text, self.intent_categories)
                return {
                    "primary": result["labels"][0],
                    "secondary": result["labels"][1:3],
                    "scores": {
                        label: score for label, score in zip(result["labels"], result["scores"])
                    },
                }
            except Exception as e:
                logger.warning(f"Intent classification failed: {e}")

        # Fallback: keyword-based classification
        text_lower = text.lower()
        intent_scores = {}

        for intent in self.intent_categories:
            score = 0.0
            keywords = {
                "Authentication": ["login", "auth", "password", "token", "session"],
                "User Management": ["user", "profile", "account", "member"],
                "CRUD Operations": ["create", "read", "update", "delete", "manage"],
                "Payment Processing": ["payment", "stripe", "paypal", "billing", "invoice"],
                "Email Notifications": ["email", "send", "notify", "mail"],
                "File Management": ["file", "upload", "download", "document"],
                "Reporting": ["report", "analytics", "dashboard", "metrics"],
                "API Integration": ["api", "integrate", "webhook", "endpoint"],
                "Data Analytics": ["analytics", "data", "statistics", "insights"],
                "Search": ["search", "find", "filter", "query"],
            }

            if intent in keywords:
                for keyword in keywords[intent]:
                    if keyword in text_lower:
                        score += 0.2

            intent_scores[intent] = min(score, 1.0)

        # Sort by score
        sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)

        return {
            "primary": sorted_intents[0][0] if sorted_intents else "User Management",
            "secondary": [s[0] for s in sorted_intents[1:3]],
            "scores": intent_scores,
        }

    def _extract_requirements(self, doc, text: str) -> Dict[str, List[str]]:
        """Extract functional and non-functional requirements."""
        requirements = {
            "functional": [],
            "non_functional": [],
        }

        # Functional requirement patterns
        functional_patterns = [
            "user can",
            "system should",
            "must allow",
            "able to",
            "functionality to",
            "feature to",
            "capability to",
            "should be able",
        ]

        # Non-functional patterns
        nfr_patterns = [
            "secure",
            "fast",
            "scalable",
            "reliable",
            "available",
            "performance",
            "security",
            "usability",
            "maintainability",
            "responsive",
        ]

        text_lower = text.lower()

        for sent in doc.sents:
            sent_text = sent.text.lower()

            # Check for functional requirements
            if any(pattern in sent_text for pattern in functional_patterns):
                requirements["functional"].append(sent.text.strip())

            # Check for non-functional requirements
            if any(pattern in sent_text for pattern in nfr_patterns):
                requirements["non_functional"].append(sent.text.strip())

        return requirements

    def _extract_requirements_fallback(self, text: str) -> Dict[str, List[str]]:
        """Fallback requirement extraction."""
        requirements = {
            "functional": [],
            "non_functional": [],
        }

        sentences = text.split(".")

        functional_patterns = ["user can", "system should", "must allow", "able to"]
        nfr_patterns = ["secure", "fast", "scalable", "reliable"]

        for sentence in sentences:
            sent_lower = sentence.lower()
            if any(pattern in sent_lower for pattern in functional_patterns):
                requirements["functional"].append(sentence.strip())
            if any(pattern in sent_lower for pattern in nfr_patterns):
                requirements["non_functional"].append(sentence.strip())

        return requirements

    def _identify_personas(self, doc, text: str) -> List[str]:
        """Identify user personas/roles."""
        personas = set()

        # Common role keywords
        role_keywords = [
            "user",
            "admin",
            "administrator",
            "customer",
            "manager",
            "developer",
            "team member",
            "stakeholder",
            "visitor",
            "guest",
            "subscriber",
            "member",
            "owner",
            "moderator",
        ]

        text_lower = text.lower()

        for token in doc:
            if token.text.lower() in role_keywords:
                personas.add(token.text.title())

        # Also check entities
        for ent in doc.ents:
            if ent.label_ == "PERSON" and ent.text.lower() in role_keywords:
                personas.add(ent.text.title())

        return list(personas) if personas else ["User"]

    def _identify_personas_fallback(self, text: str) -> List[str]:
        """Fallback persona identification."""
        personas = set()
        role_keywords = [
            "user",
            "admin",
            "customer",
            "manager",
            "developer",
            "visitor",
            "guest",
        ]

        text_lower = text.lower()
        for role in role_keywords:
            if role in text_lower:
                personas.add(role.title())

        return list(personas) if personas else ["User"]

    def _identify_integrations(self, text: str) -> List[Dict]:
        """Identify third-party integrations."""
        integrations = []

        integration_keywords = {
            "sendgrid": "Email service",
            "stripe": "Payment processing",
            "twilio": "SMS service",
            "aws s3": "File storage",
            "google maps": "Location service",
            "firebase": "Backend service",
            "slack": "Communication",
            "github": "Version control",
            "jira": "Project management",
            "aws": "Cloud services",
            "azure": "Cloud services",
            "mongodb": "Database",
            "redis": "Cache",
        }

        text_lower = text.lower()

        for service, purpose in integration_keywords.items():
            if service in text_lower:
                integrations.append({"service": service.title(), "purpose": purpose})

        return integrations

    def _analyze_complexity(self, doc, entities: Dict, text: str) -> List[str]:
        """Identify complexity factors."""
        factors = []

        # Check for integrations
        if entities.get("technologies"):
            tech_list = ", ".join(entities["technologies"][:3])
            factors.append(f"Uses multiple technologies: {tech_list}")

        # Check for CRUD operations
        crud_actions = [
            a for a in entities.get("actions", []) if a.lower() in ["create", "read", "update", "delete"]
        ]
        if len(crud_actions) >= 3:
            factors.append("Full CRUD operations required")

        # Check for authentication/security
        security_keywords = ["auth", "login", "secure", "encrypt", "password"]
        if any(keyword in text.lower() for keyword in security_keywords):
            factors.append("Security and authentication required")

        # Check for real-time features
        realtime_keywords = ["real-time", "live", "instant", "websocket", "socket"]
        if any(keyword in text.lower() for keyword in realtime_keywords):
            factors.append("Real-time functionality needed")

        # Check for multiple user roles
        if len(entities.get("user_roles", [])) > 2:
            roles_list = ", ".join(entities["user_roles"][:3])
            factors.append(f"Multiple user roles: {roles_list}")

        return factors

    def _analyze_complexity_fallback(self, entities: Dict, text: str) -> List[str]:
        """Fallback complexity analysis."""
        factors = []

        if entities.get("technologies"):
            factors.append(f"Uses technologies: {', '.join(entities['technologies'][:3])}")

        text_lower = text.lower()
        if any(kw in text_lower for kw in ["auth", "login", "secure"]):
            factors.append("Security and authentication required")

        return factors

    def generate_user_stories(self, analysis: Dict, feature_title: str) -> List[Dict]:
        """Generate user stories from NLP analysis."""
        stories = []

        personas = analysis["personas"]
        actions = analysis["entities"]["actions"]
        requirements = analysis["functional_requirements"]

        # Generate stories from requirements
        for i, req in enumerate(requirements[:5], 1):  # Max 5 stories
            # Try to extract persona, action, benefit
            persona = personas[0] if personas else "User"

            # Extract action from requirement
            action = "perform an action"
            for act in actions:
                if act.lower() in req.lower():
                    action = act
                    break

            story = {
                "title": f"{feature_title} - Story {i}",
                "description": f"As a {persona}, I want to {action} so that I can accomplish my goal",
                "acceptance_criteria": [
                    f"Given I am a {persona}",
                    "When I perform the action",
                    "Then the expected result occurs",
                ],
                "estimated_points": self._estimate_points(req),
                "priority": "high" if i <= 2 else "medium",
            }

            stories.append(story)

        return stories

    def _estimate_points(self, requirement: str) -> int:
        """Estimate story points based on requirement complexity."""
        # Simple heuristic based on length and keywords
        complexity_keywords = ["integrate", "complex", "multiple", "secure", "real-time"]

        points = 3  # Base points

        # Add points for complexity
        for keyword in complexity_keywords:
            if keyword in requirement.lower():
                points += 2

        # Adjust based on length
        if len(requirement) > 100:
            points += 1

        # Cap at 13 (Fibonacci)
        return min(points, 13)


# Create global instance
nlp_analyzer = AdvancedFeatureNLP()

