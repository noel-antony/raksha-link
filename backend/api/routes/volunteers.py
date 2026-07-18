"""
RakshaLink API - Volunteer Routes

CRUD endpoints for the ``volunteers`` Firestore collection.
"""

from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException, Query

from api.schemas.volunteer import VolunteerCreate, VolunteerUpdate, VolunteerResponse
from api.services.volunteer import (
    create_volunteer,
    get_volunteer,
    list_volunteers,
    update_volunteer,
    soft_delete_volunteer,
    search_volunteers
)
from api.models.volunteer import Availability, Status
from api.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


@router.post("/", response_model=VolunteerResponse, status_code=201)
async def create_volunteer_endpoint(payload: VolunteerCreate) -> dict:
    """Register a new volunteer."""
    try:
        data = payload.model_dump(exclude_none=False)
        data["location"] = dict(data["location"])
        # Enums are converted to strings by model_dump, but if not, explicit string cast
        data["availability"] = data["availability"].value if hasattr(data["availability"], "value") else data["availability"]
        
        result = await create_volunteer(data)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        logger.error("Failed to create volunteer: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create volunteer.") from exc


@router.get("/search", response_model=List[Any])
async def search_volunteers_endpoint(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: float = Query(..., gt=0, description="Search radius in meters"),
    availability: Optional[Availability] = None,
    status: Optional[Status] = None,
    skill: Optional[str] = None
) -> list:
    """Search volunteers by geographic radius and optional filters."""
    try:
        avail_str = availability.value if availability else None
        stat_str = status.value if status else None
        
        return await search_volunteers(
            lat=lat,
            lng=lng,
            radius=radius,
            availability=avail_str,
            status=stat_str,
            skill=skill
        )
    except Exception as exc:
        logger.error("Failed to search volunteers: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to search volunteers.") from exc


@router.get("/", response_model=List[VolunteerResponse])
async def list_volunteers_endpoint() -> list:
    """List all volunteers."""
    try:
        return await list_volunteers()
    except Exception as exc:
        logger.error("Failed to list volunteers: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve volunteers.") from exc


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer_endpoint(volunteer_id: str) -> dict:
    """Retrieve a volunteer by ID."""
    try:
        volunteer = await get_volunteer(volunteer_id)
    except Exception as exc:
        logger.error("Firestore error fetching volunteer %s: %s", volunteer_id, exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve volunteer.") from exc

    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    return volunteer


@router.patch("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer_endpoint(volunteer_id: str, payload: VolunteerUpdate) -> dict:
    """Update an existing volunteer."""
    update_data = payload.model_dump(exclude_none=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    if "location" in update_data and update_data["location"] is not None:
        update_data["location"] = dict(update_data["location"])
    if "availability" in update_data:
        update_data["availability"] = update_data["availability"].value if hasattr(update_data["availability"], "value") else update_data["availability"]
    if "status" in update_data:
        update_data["status"] = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]

    try:
        result = await update_volunteer(volunteer_id, update_data)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as exc:
        logger.error("Firestore error updating volunteer %s: %s", volunteer_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update volunteer.") from exc

    if result is None:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    return result


@router.delete("/{volunteer_id}", status_code=200)
async def delete_volunteer_endpoint(volunteer_id: str) -> dict:
    """Soft delete a volunteer."""
    try:
        deleted = await soft_delete_volunteer(volunteer_id)
    except Exception as exc:
        logger.error("Firestore error soft deleting volunteer %s: %s", volunteer_id, exc)
        raise HTTPException(status_code=500, detail="Failed to soft delete volunteer.") from exc

    if not deleted:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    return {"detail": "Volunteer successfully marked as inactive.", "id": volunteer_id}
