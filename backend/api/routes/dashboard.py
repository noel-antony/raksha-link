from fastapi import APIRouter, HTTPException
from typing import List
from api.schemas.dashboard import DashboardResponse, ActivityItem
from api.services.dashboard import get_dashboard_data, get_recent_activity
from api.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard", response_model=DashboardResponse, summary="Get dashboard aggregation")
async def get_dashboard_endpoint() -> dict:
    """
    Returns aggregated statistics, recent incidents, recent missions, 
    high priority incidents, and volunteer summary for the dashboard.
    """
    try:
        return await get_dashboard_data()
    except Exception as exc:
        logger.error("Failed to load dashboard data: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to load dashboard data.") from exc


@router.get("/activity", response_model=List[ActivityItem], summary="Get recent activity feed")
async def get_activity_endpoint() -> list:
    """
    Combines recent incidents, missions, and volunteer registrations into a unified feed.
    """
    try:
        return await get_recent_activity()
    except Exception as exc:
        logger.error("Failed to load activity feed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to load activity feed.") from exc
