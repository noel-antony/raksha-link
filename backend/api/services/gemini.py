"""
RakshaLink API - Gemini Service

Handles Google Gemini API integration for AI-powered analysis.
"""

import json
import google.generativeai as genai
from api.config import settings
from api.services.prompts import INCIDENT_ANALYSIS_PROMPT
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

    async def analyze_incident(self, title: str, description: str, severity: str) -> dict:
        """Classify a raw incident report into structured data.

        Returns a dictionary matching the AIAnalysis output format.
        Raises an exception if Gemini fails or returns invalid JSON.
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
            raise ValueError("Gemini did not return valid JSON.") from e
        except Exception as e:
            logger.error("Gemini API error: %s", e)
            raise

gemini_service = GeminiService()
