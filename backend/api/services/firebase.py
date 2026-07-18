"""
RakshaLink API - Firebase Service

Handles Firebase Admin SDK initialization, Firestore connectivity,
and reusable CRUD helpers for the incidents collection.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
from typing import Any, Optional

from api.config import settings
from api.utils.logger import get_logger

logger = get_logger(__name__)

# ── Module-level singleton ───────────────────────────────────────────────────
_firestore_client: Optional[firestore.firestore.Client] = None


def _initialize_firebase() -> None:
    """Initialize the Firebase Admin SDK exactly once.

    Reads credentials from the FIREBASE_CREDENTIALS env var (path to a
    service-account JSON file).  Falls back to Application Default
    Credentials when no explicit path is provided.
    """
    if firebase_admin._apps:
        # Already initialized — nothing to do.
        return

    try:
        cred_path = settings.FIREBASE_CREDENTIALS
        if cred_path:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                "projectId": settings.FIREBASE_PROJECT_ID,
            })
            logger.info("Firebase initialized with service-account credentials.")
        else:
            # Use Application Default Credentials (e.g. on Cloud Run / GCE)
            firebase_admin.initialize_app(options={
                "projectId": settings.FIREBASE_PROJECT_ID,
            })
            logger.info("Firebase initialized with application-default credentials.")
    except Exception as exc:
        logger.error("Firebase initialization failed: %s", exc)
        raise RuntimeError(f"Firebase initialization failed: {exc}") from exc


def get_firestore() -> firestore.firestore.Client:
    """Return the Firestore client, initializing Firebase if needed.

    The client is created once and cached at module level so every
    caller shares the same connection.
    """
    global _firestore_client

    if _firestore_client is None:
        _initialize_firebase()
        _firestore_client = firestore.client()
        logger.info("Firestore client created.")

    return _firestore_client


# ── Collection reference helper ──────────────────────────────────────────────
INCIDENTS_COLLECTION = "incidents"


def _now_iso() -> str:
    """Return the current UTC timestamp as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


# ── Incident CRUD ────────────────────────────────────────────────────────────

async def create_incident(data: dict[str, Any]) -> dict[str, Any]:
    """Create a new incident document in Firestore.

    Args:
        data: Validated incident fields (from the request schema).

    Returns:
        The full document dict including the generated ``id``.
    """
    db = get_firestore()
    now = _now_iso()

    doc_data: dict[str, Any] = {
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "category": data.get("category", "unknown"),
        "priority": data.get("priority", "unknown"),
        "severity": data.get("severity", "medium"),
        "status": "pending",
        "location": data.get("location"),
        "createdAt": now,
        "updatedAt": now,
        "imageUrl": data.get("imageUrl", ""),
        "aiAnalysis": None,
    }

    doc_ref = db.collection(INCIDENTS_COLLECTION).document()
    doc_data["id"] = doc_ref.id
    doc_ref.set(doc_data)

    logger.info("Incident created: %s", doc_ref.id)
    return doc_data


async def get_incident(incident_id: str) -> Optional[dict[str, Any]]:
    """Fetch a single incident by its document ID.

    Returns:
        The document dict, or ``None`` if not found.
    """
    db = get_firestore()
    doc = db.collection(INCIDENTS_COLLECTION).document(incident_id).get()

    if not doc.exists:
        return None

    return {"id": doc.id, **doc.to_dict()}


async def list_incidents() -> list[dict[str, Any]]:
    """Return all incidents ordered by creation time (newest first)."""
    db = get_firestore()
    docs = (
        db.collection(INCIDENTS_COLLECTION)
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .stream()
    )

    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


async def update_incident(
    incident_id: str, data: dict[str, Any]
) -> Optional[dict[str, Any]]:
    """Update an existing incident document.

    Only the fields present in *data* are overwritten; other fields
    remain untouched.  ``updatedAt`` is set automatically.

    Returns:
        The updated document dict, or ``None`` if the document was not found.
    """
    db = get_firestore()
    doc_ref = db.collection(INCIDENTS_COLLECTION).document(incident_id)

    # Verify the document exists before updating.
    if not doc_ref.get().exists:
        return None

    data["updatedAt"] = _now_iso()
    doc_ref.update(data)

    # Return the full updated document.
    updated = doc_ref.get()
    return {"id": updated.id, **updated.to_dict()}


async def delete_incident(incident_id: str) -> bool:
    """Delete an incident document.

    Returns:
        ``True`` if the document existed and was deleted,
        ``False`` if it was not found.
    """
    db = get_firestore()
    doc_ref = db.collection(INCIDENTS_COLLECTION).document(incident_id)

    if not doc_ref.get().exists:
        return False

    doc_ref.delete()
    logger.info("Incident deleted: %s", incident_id)
    return True
