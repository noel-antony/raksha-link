"""
RakshaLink API - Volunteer Matching Service

Matches available volunteers to active incidents based on skills,
proximity, and AI-driven suitability scoring.
"""


class MatchingService:
    """Ranks and selects the best volunteers for a given incident."""

    async def get_candidates(self, incident_id: str, radius_km: float = 50.0) -> list:
        """Fetch volunteers within range of the incident."""
        # TODO: Query Firestore volunteers collection with geo-filter
        pass

    async def rank_matches(self, incident_data: dict, candidates: list) -> list:
        """Use AI to rank candidates by skill fit, distance, and availability."""
        # TODO: Implement Gemini-powered matching logic
        pass
