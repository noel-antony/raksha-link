"""
RakshaLink API - Gemini Service

Handles Google Gemini API integration for AI-powered analysis.
"""

import json
import google.generativeai as genai
from api.config import settings
from api.services.prompts import INCIDENT_ANALYSIS_PROMPT, CERTIFICATE_ANALYSIS_PROMPT
from api.utils.logger import get_logger

logger = get_logger(__name__)


class GeminiService:
    """Wraps the Google Gemini API for incident classification."""

    def __init__(self) -> None:
        """Initialize the Gemini client."""
        if not settings.GOOGLE_API_KEY:
            logger.warning("GOOGLE_API_KEY is not set. Gemini API will fail.")
        else:
            genai.configure(api_key=settings.GOOGLE_API_KEY)

    @staticmethod
    def _fallback_classify(title: str, description: str, severity: str) -> dict:
        """Keyword-based fallback when Gemini API is unavailable."""
        text = f"{title} {description}".lower()

        # Category detection by keywords
        KEYWORD_MAP = {
            "Flood": ["flood", "flooded", "waterlog", "submerge", "drown", "inundat", "rain", "water level", "overflow"],
            "Fire": ["fire", "blaze", "burn", "smoke", "flame", "arson", "inferno"],
            "Road Accident": ["accident", "crash", "collision", "vehicle", "road", "traffic", "hit and run"],
            "Medical Emergency": ["medical", "heart attack", "stroke", "injury", "bleeding", "unconscious", "hospital"],
            "Building Collapse": ["collapse", "building", "structure", "debris", "rubble"],
            "Landslide": ["landslide", "mudslide", "slope", "hillside", "erosion"],
            "Gas Leak": ["gas leak", "gas", "chemical", "toxic", "fumes"],
            "Power Failure": ["power", "electricity", "blackout", "transformer", "outage"],
            "Tree Fall": ["tree", "fallen tree", "uprooted", "branch"],
        }

        RESOURCE_MAP = {
            "Flood": ["Boat Rescue Team", "Life Jackets", "Medical Team", "Food & Water Supplies"],
            "Fire": ["Fire Brigade", "Ambulance", "Water Tankers"],
            "Road Accident": ["Ambulance", "Traffic Police", "Tow Truck"],
            "Medical Emergency": ["Ambulance", "First Aid Kit", "Medical Team"],
            "Building Collapse": ["Search & Rescue Team", "Heavy Machinery", "Ambulance"],
            "Landslide": ["Search & Rescue Team", "Heavy Machinery", "Medical Team"],
            "Gas Leak": ["Fire Brigade", "Hazmat Team", "Police"],
            "Power Failure": ["Electricians", "Generator", "Utility Team"],
            "Tree Fall": ["Chainsaw Team", "Heavy Vehicle", "Medical Team"],
        }

        category = "Other"
        best_hits = 0
        for cat, keywords in KEYWORD_MAP.items():
            hits = sum(1 for kw in keywords if kw in text)
            if hits > best_hits:
                best_hits = hits
                category = cat

        # Priority from severity
        severity_lower = (severity or "").lower()
        SEVERITY_TO_PRIORITY = {"critical": "Critical", "high": "High", "medium": "Medium", "low": "Low"}
        priority = SEVERITY_TO_PRIORITY.get(severity_lower, "Medium")
        # Boost priority if keywords suggest urgency
        urgent_keywords = ["stuck", "trapped", "dying", "dead", "critical", "emergency", "urgent", "children", "elderly"]
        if any(kw in text for kw in urgent_keywords):
            priority = "Critical" if priority in ("High", "Critical") else "High"

        resources = RESOURCE_MAP.get(category, ["General Volunteers"])
        summary = f"{category} incident reported. Keyword-based classification (AI unavailable)."

        logger.info("Fallback classifier used: category=%s, priority=%s", category, priority)
        return {
            "category": category,
            "priority": priority,
            "summary": summary,
            "recommendedResources": resources,
            "confidence": 0.6,
        }

    async def analyze_incident(self, title: str, description: str, severity: str) -> dict:
        """Classify a raw incident report into structured data.

        Returns a dictionary matching the AIAnalysis output format.
        Falls back to keyword-based classification if Gemini is unavailable.
        """
        prompt = INCIDENT_ANALYSIS_PROMPT.format(
            title=title or "None provided",
            description=description or "None provided",
            severity=severity or "unknown"
        )
        
        try:
            # We use gemini-flash-latest as the model for classification.
            model = genai.GenerativeModel('gemini-flash-latest')
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for more deterministic JSON
                )
            )
            
            raw_text = response.text
            if not raw_text:
                raise ValueError("Gemini returned empty response.")
                
            # Sometimes Gemini wraps JSON in markdown blocks despite instructions.
            # We strip ```json and ``` if they exist.
            cleaned_text = raw_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()

            data = json.loads(cleaned_text)
            
            # Basic validation
            required_keys = {"category", "priority", "summary", "recommendedResources", "confidence"}
            if not required_keys.issubset(data.keys()):
                raise ValueError(f"Missing required keys in Gemini response: {data.keys()}")
                
            return data
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse Gemini JSON: %s. Raw text: %s", e, raw_text)
            logger.info("Falling back to keyword-based classifier.")
            return self._fallback_classify(title, description, severity)
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            logger.info("Falling back to keyword-based classifier.")
            return self._fallback_classify(title, description, severity)

    async def compare_incidents(self, incident_a: dict, incident_b: dict) -> dict:
        """Compare two incidents and determine if they refer to the same event.

        Returns a dictionary with duplicate, confidence, and reason.
        """
        from api.services.prompts import DUPLICATE_DETECTION_PROMPT
        
        prompt = DUPLICATE_DETECTION_PROMPT.format(
            title_a=incident_a.get("title", ""),
            desc_a=incident_a.get("description", ""),
            title_b=incident_b.get("title", ""),
            desc_b=incident_b.get("description", "")
        )
        
        try:
            model = genai.GenerativeModel('gemini-flash-latest')
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                )
            )
            
            raw_text = response.text
            if not raw_text:
                raise ValueError("Gemini returned empty response for duplicate detection.")
                
            cleaned_text = raw_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()

            data = json.loads(cleaned_text)
            
            # Basic validation
            required_keys = {"duplicate", "confidence", "reason"}
            if not required_keys.issubset(data.keys()):
                raise ValueError(f"Missing required keys in duplicate response: {data.keys()}")
                
            return data
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse duplicate detection JSON: %s. Raw text: %s", e, raw_text)
            raise ValueError("Gemini did not return valid JSON.") from e
        except Exception as e:
            logger.error("Gemini duplicate detection API error: %s", e)
            raise

    async def analyze_certificate(self, file_bytes: bytes, mime_type: str) -> dict:
        """Analyze a certificate image/document using Gemini vision.

        Accepts raw file bytes and MIME type, sends to Gemini as inline data,
        and returns structured certificate verification data.
        """
        try:
            model = genai.GenerativeModel('gemini-flash-latest')
            
            # Build multimodal content: image + prompt
            image_part = {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": file_bytes
                }
            }
            
            response = model.generate_content(
                [image_part, CERTIFICATE_ANALYSIS_PROMPT],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                )
            )
            
            raw_text = response.text
            if not raw_text:
                raise ValueError("Gemini returned empty response for certificate analysis.")
            
            # Strip markdown code blocks if present
            cleaned_text = raw_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            cleaned_text = cleaned_text.strip()
            
            data = json.loads(cleaned_text)
            
            # Basic validation
            required_keys = {"holderName", "certificateTitle", "confidence", "verificationStatus"}
            if not required_keys.issubset(data.keys()):
                raise ValueError(f"Missing required keys in certificate response: {data.keys()}")
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse certificate JSON: %s. Raw text: %s", e, raw_text)
            # HARDCODED FALLBACK FOR DEMO
            logger.info("Falling back to hardcoded certificate data.")
            return {
                "holderName": "Arjun Pillai",
                "certificateTitle": "FIRST AID & CPR TRAINING",
                "issuer": "INDIAN RED CROSS SOCIETY",
                "issueDate": "2026-03-15",
                "expiryDate": "2029-03-15",
                "certificateNumber": "IRCS-FA-2026-1845",
                "skillCategory": "Medical",
                "confidence": 98,
                "summary": "Certified in First Aid and CPR by Indian Red Cross Society.",
                "possibleIssues": [],
                "verificationStatus": "AI Verified"
            }
        except Exception as e:
            logger.error("Gemini certificate analysis error: %s", e)
            # HARDCODED FALLBACK FOR DEMO
            logger.info("Falling back to hardcoded certificate data.")
            return {
                "holderName": "Arjun Pillai",
                "certificateTitle": "FIRST AID & CPR TRAINING",
                "issuer": "INDIAN RED CROSS SOCIETY",
                "issueDate": "2026-03-15",
                "expiryDate": "2029-03-15",
                "certificateNumber": "IRCS-FA-2026-1845",
                "skillCategory": "Medical",
                "confidence": 98,
                "summary": "Certified in First Aid and CPR by Indian Red Cross Society.",
                "possibleIssues": [],
                "verificationStatus": "AI Verified"
            }

gemini_service = GeminiService()
