"""
RakshaLink API - Incident Routes

CRUD endpoints for the ``incidents`` Firestore collection.
Routes are kept thin — all Firestore logic lives in services/firebase.py.
"""

from fastapi import APIRouter, HTTPException
from typing import List

from api.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse
from api.services.firebase import (
    create_incident,
    get_incident,
    list_incidents,
    update_incident,
    delete_incident,
)
from api.services.gemini import gemini_service
from api.services.duplicate import detect_duplicate
from api.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.post("/", response_model=IncidentResponse, status_code=201)
async def create_incident_endpoint(payload: IncidentCreate) -> dict:
    """Create a new incident report and automatically analyze it using Gemini.

    - ``status`` defaults to ``pending``
    - ``category`` defaults to ``unknown``
    - ``priority`` defaults to ``unknown``
    - ``aiAnalysis`` defaults to ``null``
    """
    try:
        data = payload.model_dump(exclude_none=False)

        # Serialize the nested location model to a plain dict for Firestore.
        if data.get("location") is not None:
            data["location"] = dict(data["location"])

        result = await create_incident(data)
    except Exception as exc:
        logger.error("Failed to create incident: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create incident.") from exc

    # Attempt AI Analysis (do not block or fail if this crashes)
    incident_id = result["id"]
    try:
        ai_data = await gemini_service.analyze_incident(
            title=result.get("title", ""),
            description=result.get("description", ""),
            severity=result.get("severity", "")
        )
        
        # Update the Firestore document with the AI findings
        update_payload = {
            "category": ai_data.get("category", "unknown"),
            "priority": ai_data.get("priority", "unknown"),
            "aiAnalysis": {
                "summary": ai_data.get("summary", ""),
                "recommendedResources": ai_data.get("recommendedResources", []),
                "confidence": ai_data.get("confidence", 0.0)
            }
        }
        updated_result = await update_incident(incident_id, update_payload)
        if updated_result:
            result = updated_result
            logger.info("AI analysis completed and saved for incident %s", incident_id)
            
    except Exception as exc:
        # We catch all exceptions here to ensure the endpoint still returns 201 
        # with the unanalyzed incident data, maintaining critical platform availability.
        logger.error("AI analysis failed for incident %s: %s", incident_id, exc)

    # Attempt Duplicate Detection
    try:
        dup_result = await detect_duplicate(result)
        if dup_result:
            updated_result = await update_incident(incident_id, dup_result)
            if updated_result:
                result = updated_result
                logger.info("Duplicate detection completed and saved for incident %s", incident_id)
    except Exception as exc:
        logger.error("Duplicate detection failed for incident %s: %s", incident_id, exc)

    return result


@router.get("/", response_model=List[IncidentResponse])
async def list_incidents_endpoint() -> list:
    """Return all incidents, newest first."""
    try:
        return await list_incidents()
    except Exception as exc:
        logger.error("Failed to list incidents: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents.") from exc


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident_endpoint(incident_id: str) -> dict:
    """Return a single incident by ID."""
    try:
        incident = await get_incident(incident_id)
    except Exception as exc:
        logger.error("Firestore error fetching incident %s: %s", incident_id, exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve incident.") from exc

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found.")

    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident_endpoint(incident_id: str, payload: IncidentUpdate) -> dict:
    """Partially update an incident.

    Only the fields included in the request body are overwritten.
    ``updatedAt`` is set automatically.
    """
    # Build a dict of only the fields the client actually sent.
    update_data = payload.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    # Serialize nested location if present.
    if "location" in update_data and update_data["location"] is not None:
        update_data["location"] = dict(update_data["location"])

    try:
        result = await update_incident(incident_id, update_data)
    except Exception as exc:
        logger.error("Firestore error updating incident %s: %s", incident_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update incident.") from exc

    if result is None:
        raise HTTPException(status_code=404, detail="Incident not found.")

    return result


@router.delete("/{incident_id}", status_code=200)
async def delete_incident_endpoint(incident_id: str) -> dict:
    """Delete an incident by ID."""
    try:
        deleted = await delete_incident(incident_id)
    except Exception as exc:
        logger.error("Firestore error deleting incident %s: %s", incident_id, exc)
        raise HTTPException(status_code=500, detail="Failed to delete incident.") from exc

    if not deleted:
        raise HTTPException(status_code=404, detail="Incident not found.")

    return {"detail": "Incident deleted.", "id": incident_id}
