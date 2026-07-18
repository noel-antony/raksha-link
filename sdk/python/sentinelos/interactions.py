import httpx
from typing import Dict, Any, List, Optional
import uuid

class Agent:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

class Session:
    """
    Mimics the antigravity-preview Interactions API `Session` object.
    Maintains conversation state with a specific Managed Agent.
    """
    def __init__(self, client: 'InteractionsClient', agent: Agent):
        self.client = client
        self.agent = agent
        self.session_id = str(uuid.uuid4())
        self.history: List[Dict[str, str]] = []

    def send_message(self, message: str) -> str:
        """Send a natural language message to the agent and await its response."""
        self.history.append({"role": "user", "content": message})
        
        # Simulate routing through the SentinelOS backend API
        response = self.client.http_client.post("/api/interactions", json={
            "session_id": self.session_id,
            "agent_name": self.agent.name,
            "message": message,
            "history": self.history
        })
        
        # We will mock the backend logic locally for the hackathon if the endpoint doesn't exist
        if response.status_code == 404:
            # Fallback mock for the hackathon to demonstrate iAPI state
            if "water" in message.lower() or "flood" in message.lower():
                reply = f"[{self.agent.name}] Acknowledged. I have analyzed the input and published an IncidentDetected event for a suspected flood."
            else:
                reply = f"[{self.agent.name}] Processing update. No critical incidents detected in this feed."
        else:
            response.raise_for_status()
            reply = response.json().get("reply", "No response")
            
        self.history.append({"role": "agent", "content": reply})
        return reply

class InteractionsClient:
    """
    Wrapper for the Google Interactions API (iAPI) for Managed Agents.
    """
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self.http_client = httpx.Client(base_url=self.base_url)
        
        # Pre-registered Managed Agents in SentinelOS
        self.sensor_fusion_agent = Agent("SensorFusionAgent", "Analyzes multimodal signals to detect incidents.")
        self.mission_planner_agent = Agent("MissionPlannerAgent", "Allocates resources and skills for detected incidents.")
        self.incident_commander_agent = Agent("IncidentCommanderAgent", "Oversees mission approval and human overrides.")

    def create_session(self, agent: Agent) -> Session:
        """Start a new conversational session with an agent."""
        return Session(self, agent)
