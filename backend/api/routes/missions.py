from fastapi import APIRouter, HTTPException
from typing import List, Optional
from api.schemas.mission import MissionCreate, MissionUpdate, MissionResponse
from api.models.mission import MissionStatus
from api.services.mission import (
    create_mission,
    get_mission,
    list_missions,
    update_mission,
    delete_mission,
)
from api.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/missions", tags=["Missions"])


@router.post("/", response_model=MissionResponse, status_code=201)
async def create_mission_endpoint(payload: MissionCreate) -> dict:
    try:
        result = await create_mission(payload.model_dump())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        logger.error("Failed to create mission: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create mission.") from exc


@router.get("/", response_model=List[MissionResponse])
async def list_missions_endpoint(status: Optional[MissionStatus] = None, priority: Optional[str] = None) -> list:
    try:
        return await list_missions(status, priority)
    except Exception as exc:
        logger.error("Failed to list missions: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve missions.") from exc


@router.get("/{mission_id}", response_model=MissionResponse)
async def get_mission_endpoint(mission_id: str) -> dict:
    try:
        mission = await get_mission(mission_id)
    except Exception as exc:
        logger.error("Firestore error fetching mission %s: %s", mission_id, exc)
        raise HTTPException(status_code=500, detail="Failed to retrieve mission.") from exc

    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found.")

    return mission


@router.patch("/{mission_id}", response_model=MissionResponse)
async def update_mission_endpoint(mission_id: str, payload: MissionUpdate) -> dict:
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    try:
        result = await update_mission(mission_id, update_data)
    except Exception as exc:
        logger.error("Firestore error updating mission %s: %s", mission_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update mission.") from exc

    if result is None:
        raise HTTPException(status_code=404, detail="Mission not found.")

    return result


@router.delete("/{mission_id}", status_code=200)
async def delete_mission_endpoint(mission_id: str) -> dict:
    try:
        deleted = await delete_mission(mission_id)
    except Exception as exc:
        logger.error("Firestore error deleting mission %s: %s", mission_id, exc)
        raise HTTPException(status_code=500, detail="Failed to delete mission.") from exc

    if not deleted:
        raise HTTPException(status_code=404, detail="Mission not found.")

    return {"detail": "Mission deleted.", "id": mission_id}
