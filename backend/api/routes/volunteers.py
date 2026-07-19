"""
RakshaLink API - Volunteer Routes

CRUD endpoints for the ``volunteers`` Firestore collection.
"""

from typing import List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
import base64

from api.schemas.volunteer import (
    VolunteerCreate, VolunteerUpdate, VolunteerResponse,
    CertificateDataSchema, CertificateReviewRequest
)
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


@router.post("", response_model=VolunteerResponse, status_code=201)
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


@router.get("", response_model=List[VolunteerResponse])
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


# ── Certificate Endpoints ────────────────────────────────────────────────────

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/{volunteer_id}/certificate", response_model=CertificateDataSchema)
async def upload_certificate_endpoint(
    volunteer_id: str,
    file: UploadFile = File(...)
) -> dict:
    """Upload a certificate file for AI-assisted verification."""
    # 1. Validate volunteer exists
    volunteer = await get_volunteer(volunteer_id)
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    # 2. Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Accepted: PDF, JPG, PNG, JPEG."
        )

    # 3. Read and validate file size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 4. Run Gemini analysis
    try:
        from api.services.gemini import gemini_service
        
        # Gemini needs base64-encoded bytes for inline_data
        b64_bytes = base64.b64encode(file_bytes).decode("utf-8")
        verification = await gemini_service.analyze_certificate(b64_bytes, file.content_type)
    except ValueError as ve:
        logger.error("Certificate analysis failed for %s: %s", volunteer_id, ve)
        # Return a failed verification instead of crashing
        verification = {
            "holderName": "",
            "certificateTitle": "",
            "issuer": "",
            "issueDate": "",
            "expiryDate": "",
            "certificateNumber": "",
            "skillCategory": "General",
            "confidence": 0,
            "summary": "AI analysis could not process this document.",
            "possibleIssues": ["AI analysis failed. The document may be unreadable."],
            "verificationStatus": "Verification Failed"
        }
    except Exception as exc:
        logger.error("Gemini error for volunteer %s: %s", volunteer_id, exc)
        raise HTTPException(status_code=500, detail="Certificate analysis failed.") from exc

    # 5. Build data URL for preview storage
    preview_bytes = file_bytes
    if file.content_type.startswith("image/"):
        try:
            import io
            from PIL import Image
            img = Image.open(io.BytesIO(file_bytes))
            img.thumbnail((800, 800))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            out_io = io.BytesIO()
            img.save(out_io, format='JPEG', quality=70)
            preview_bytes = out_io.getvalue()
            file.content_type = "image/jpeg"
        except Exception as e:
            logger.warning("Failed to compress image preview: %s", e)

    data_url = f"data:{file.content_type};base64,{base64.b64encode(preview_bytes).decode('utf-8')}"

    # 6. Build certificate document
    certificate_data = {
        "uploaded": True,
        "fileUrl": data_url,
        "verification": {
            "status": verification.get("verificationStatus", "Needs Review"),
            "confidence": verification.get("confidence", 0),
            "holderName": verification.get("holderName", ""),
            "issuer": verification.get("issuer", ""),
            "certificateTitle": verification.get("certificateTitle", ""),
            "skillCategory": verification.get("skillCategory", "General"),
            "issueDate": verification.get("issueDate", ""),
            "expiryDate": verification.get("expiryDate", ""),
            "certificateNumber": verification.get("certificateNumber", ""),
            "summary": verification.get("summary", ""),
            "possibleIssues": verification.get("possibleIssues", []),
        },
        "coordinatorApproved": None,
    }

    # 7. Write to Firestore
    try:
        await update_volunteer(volunteer_id, {"certificate": certificate_data})
    except Exception as exc:
        logger.error("Failed to save certificate for %s: %s", volunteer_id, exc)
        raise HTTPException(status_code=500, detail="Failed to save certificate data.") from exc

    return certificate_data


@router.patch("/{volunteer_id}/certificate/review")
async def review_certificate_endpoint(
    volunteer_id: str,
    payload: CertificateReviewRequest
) -> dict:
    """Coordinator action: approve, reject, or request re-upload of a certificate."""
    volunteer = await get_volunteer(volunteer_id)
    if volunteer is None:
        raise HTTPException(status_code=404, detail="Volunteer not found.")

    cert = volunteer.get("certificate")
    if not cert or not cert.get("uploaded"):
        raise HTTPException(status_code=400, detail="No certificate has been uploaded for this volunteer.")

    action = payload.action.lower()
    if action not in ("approve", "reject", "request_reupload"):
        raise HTTPException(status_code=400, detail="Invalid action. Must be: approve, reject, or request_reupload.")

    # Map action to field updates
    if action == "approve":
        cert["coordinatorApproved"] = True
        cert["verification"]["status"] = "Coordinator Approved"
    elif action == "reject":
        cert["coordinatorApproved"] = False
        cert["verification"]["status"] = "Rejected"
    elif action == "request_reupload":
        cert["coordinatorApproved"] = False
        cert["verification"]["status"] = "Re-upload Requested"

    try:
        await update_volunteer(volunteer_id, {"certificate": cert})
    except Exception as exc:
        logger.error("Failed to update certificate review for %s: %s", volunteer_id, exc)
        raise HTTPException(status_code=500, detail="Failed to update certificate.") from exc

    return {"detail": f"Certificate {action}d successfully.", "certificate": cert}
