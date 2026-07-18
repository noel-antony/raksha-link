"""
RakshaLink API - Duplicate Detection Service

Prevents duplicate incident reports by checking geographic proximity,
category matching, and AI semantic comparison.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from api.services.firebase import get_firestore, INCIDENTS_COLLECTION
from api.services.gemini import gemini_service
from api.utils.logger import get_logger

logger = get_logger(__name__)

# Constants
MAX_DISTANCE_METERS = 500
TIME_WINDOW_HOURS = 48


def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on the earth in meters."""
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


async def detect_duplicate(new_incident: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Check if the given new incident is a duplicate of an existing one.

    Applies three layers of filtering:
    1. Location (within 500 meters)
    2. Category (must match exactly)
    3. AI Semantic Comparison
    
    Returns:
        A dict with duplicateOf, duplicateConfidence, and duplicateReason if duplicate,
        otherwise None.
    """
    location = new_incident.get("location")
    if not location or "lat" not in location or "lng" not in location:
        logger.warning("Incident %s has no valid location. Skipping duplicate detection.", new_incident.get("id"))
        return None

    lat1 = float(location["lat"])
    lng1 = float(location["lng"])
    category = new_incident.get("category", "unknown")

    # Layer 1 & 2 preparation: fetch recent incidents
    db = get_firestore()
    cutoff_time = (datetime.now(timezone.utc) - timedelta(hours=TIME_WINDOW_HOURS)).isoformat()
    
    # Query: created in last 48 hours, not resolved, category matches
    # Note: Firestore needs a composite index for this, but since it's an MVP,
    # we'll fetch recently created and filter locally to avoid index creation hassles.
    try:
        docs = (
            db.collection(INCIDENTS_COLLECTION)
            .where("createdAt", ">=", cutoff_time)
            .stream()
        )
    except Exception as exc:
        logger.error("Error querying Firestore for duplicate detection: %s", exc)
        return None

    for doc in docs:
        existing = doc.to_dict()
        existing_id = doc.id

        # Don't compare with itself
        if existing_id == new_incident.get("id"):
            continue

        # Skip resolved incidents
        if existing.get("status") == "resolved":
            continue

        # Layer 2: Category Match
        if existing.get("category", "unknown") != category:
            continue

        # Layer 1: Distance Check
        ext_location = existing.get("location")
        if not ext_location or "lat" not in ext_location or "lng" not in ext_location:
            continue
            
        lat2 = float(ext_location["lat"])
        lng2 = float(ext_location["lng"])
        
        distance = _haversine_distance(lat1, lng1, lat2, lng2)
        if distance > MAX_DISTANCE_METERS:
            continue

        # Layer 3: AI Semantic Comparison
        try:
            ai_result = await gemini_service.compare_incidents(existing, new_incident)
            if ai_result.get("duplicate") is True:
                logger.info("Duplicate detected! New: %s, Existing: %s", new_incident.get("id"), existing_id)
                return {
                    "duplicateOf": existing_id,
                    "duplicateConfidence": ai_result.get("confidence", 0.0),
                    "duplicateReason": ai_result.get("reason", "")
                }
        except Exception as exc:
            logger.error("AI duplicate comparison failed between %s and %s: %s", new_incident.get("id"), existing_id, exc)
            continue # Try next candidate

    return None
