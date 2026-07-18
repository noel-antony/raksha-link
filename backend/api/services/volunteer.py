"""
RakshaLink API - Volunteer Service

Business logic for managing volunteers, searching by distance and skills,
and handling validations.
"""

from datetime import datetime, timezone
from typing import Any, Optional, List, Dict
from firebase_admin import firestore

from api.services.firebase import get_firestore
from api.utils.geo import haversine_distance
from api.utils.logger import get_logger

logger = get_logger(__name__)

VOLUNTEERS_COLLECTION = "volunteers"


def _now_iso() -> str:
    """Return the current UTC timestamp as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


async def check_duplicates(email: str, phone: str) -> None:
    """Check if a volunteer with the given email or phone already exists."""
    db = get_firestore()
    
    # Check email
    email_query = db.collection(VOLUNTEERS_COLLECTION).where(filter=firestore.FieldFilter("email", "==", email)).limit(1).get()
    if email_query:
        raise ValueError(f"Volunteer with email {email} already exists.")
        
    # Check phone
    phone_query = db.collection(VOLUNTEERS_COLLECTION).where(filter=firestore.FieldFilter("phone", "==", phone)).limit(1).get()
    if phone_query:
        raise ValueError(f"Volunteer with phone {phone} already exists.")


async def create_volunteer(data: dict[str, Any]) -> dict[str, Any]:
    """Create a new volunteer in Firestore after validating uniqueness."""
    await check_duplicates(data["email"], data["phone"])
    
    db = get_firestore()
    now = _now_iso()

    doc_data = {
        **data,
        "status": "Active",
        "createdAt": now,
        "updatedAt": now,
    }

    doc_ref = db.collection(VOLUNTEERS_COLLECTION).document()
    doc_data["id"] = doc_ref.id
    doc_ref.set(doc_data)

    logger.info("Volunteer created: %s", doc_ref.id)
    return doc_data


async def get_volunteer(volunteer_id: str) -> Optional[dict[str, Any]]:
    """Fetch a single volunteer by ID."""
    db = get_firestore()
    doc = db.collection(VOLUNTEERS_COLLECTION).document(volunteer_id).get()

    if not doc.exists:
        return None

    return {"id": doc.id, **doc.to_dict()}


async def list_volunteers() -> list[dict[str, Any]]:
    """Return all volunteers."""
    db = get_firestore()
    docs = db.collection(VOLUNTEERS_COLLECTION).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


async def update_volunteer(volunteer_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Partially update an existing volunteer."""
    db = get_firestore()
    doc_ref = db.collection(VOLUNTEERS_COLLECTION).document(volunteer_id)

    if not doc_ref.get().exists:
        return None
        
    # We don't check for email/phone duplication on update in this MVP for simplicity
    # but a robust system would verify the new email/phone isn't taken by someone else.

    data["updatedAt"] = _now_iso()
    doc_ref.update(data)

    updated = doc_ref.get()
    return {"id": updated.id, **updated.to_dict()}


async def soft_delete_volunteer(volunteer_id: str) -> bool:
    """Soft delete a volunteer by setting status to Inactive."""
    db = get_firestore()
    doc_ref = db.collection(VOLUNTEERS_COLLECTION).document(volunteer_id)

    if not doc_ref.get().exists:
        return False

    doc_ref.update({
        "status": "Inactive",
        "updatedAt": _now_iso()
    })
    
    logger.info("Volunteer soft deleted (Inactive): %s", volunteer_id)
    return True


async def search_volunteers(
    lat: float, 
    lng: float, 
    radius: float, 
    availability: Optional[str] = None, 
    status: Optional[str] = None, 
    skill: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Search and filter volunteers based on availability, status, skill, and geographic radius.
    Returns volunteers sorted by distance.
    """
    db = get_firestore()
    query = db.collection(VOLUNTEERS_COLLECTION)
    
    if availability:
        query = query.where(filter=firestore.FieldFilter("availability", "==", availability))
    if status:
        query = query.where(filter=firestore.FieldFilter("status", "==", status))
    if skill:
        query = query.where(filter=firestore.FieldFilter("skills", "array_contains", skill))
        
    docs = query.stream()
    
    results = []
    for doc in docs:
        vol = doc.to_dict()
        loc = vol.get("location")
        
        if not loc or "lat" not in loc or "lng" not in loc:
            continue
            
        distance = haversine_distance(lat, lng, loc["lat"], loc["lng"])
        if distance <= radius:
            results.append({
                "id": doc.id,
                **vol,
                "distance_meters": distance
            })
            
    # Sort by distance
    results.sort(key=lambda x: x["distance_meters"])
    return results
