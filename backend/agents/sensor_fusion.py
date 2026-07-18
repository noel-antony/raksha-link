import uuid
import json
import os
from typing import Any, Dict
from google import genai
from backend.agents.base import BaseAgent
from backend.events.domain import DomainEvent, IncidentDetected, WorldModelUpdated
from backend.world_model.graph import world_model

class SensorFusionAgent(BaseAgent):
    """
    Subscribes to raw sensor data, citizen SOS, and API data (e.g. flood forecasting).
    Fuses this multimodal data to detect and classify incidents using Gemini 3.5 Flash.
    """
    def __init__(self):
        super().__init__(name="SensorFusionAgent")
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("[SensorFusionAgent] Warning: GEMINI_API_KEY not found in environment.")

    def _setup_subscriptions(self):
        pass

    async def ingest_signals(self, latitude: float, longitude: float, signals: list[str], context: Dict[str, Any]):
        """
        Fuses incoming signals to determine if an incident has occurred using Gemini.
        """
        print(f"[SensorFusionAgent] Analyzing signals with Gemini: {signals}")
        
        try:
            client = genai.Client(api_key=self.api_key)
            prompt = f"""
            You are the Sensor Fusion Agent for an emergency response system. 
            Analyze the following incoming signals and context. 
            Signals: {signals}
            Context: {context}
            
            Determine if an incident has occurred. 
            Return a JSON object ONLY, with NO markdown formatting (no ```json). 
            The JSON object must contain exactly these keys:
            - "incident_detected": boolean (true if an incident is likely, false otherwise)
            - "confidence": float between 0.0 and 1.0 representing your confidence
            - "severity": string, either "LOW", "MEDIUM", "HIGH", or "CRITICAL"
            - "incident_type": string, a short 1-3 word description of the incident (e.g. "Flash Flood", "Structure Fire", "Medical Emergency")
            """
            
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
            )
            response_text = response.text.strip()
            
            # Clean up potential markdown formatting if the model still returns it
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
                
            analysis = json.loads(response_text)
            
            print(f"[SensorFusionAgent] Gemini Analysis Result: {analysis}")

            if analysis.get("incident_detected") and analysis.get("confidence", 0) > 0.6:
                event = IncidentDetected(
                    event_id=str(uuid.uuid4()),
                    source=self.name,
                    incident_type=analysis.get("incident_type", "General Emergency"),
                    latitude=latitude,
                    longitude=longitude,
                    severity=analysis.get("severity", "HIGH"),
                    confidence=analysis.get("confidence", 0.9),
                    signals=signals
                )
                await self.publish(event)

                await world_model.add_node(
                    label="Incident",
                    properties={
                        "type": event.incident_type,
                        "severity": event.severity,
                        "confidence": event.confidence,
                        "lat": latitude,
                        "lng": longitude,
                        "status": "DETECTED"
                    },
                    node_id=event.event_id
                )
        except Exception as e:
            print(f"[SensorFusionAgent] Error calling Gemini API: {e}")
            # Fallback to simulated logic if API fails
            print("[SensorFusionAgent] Falling back to simulated logic...")
            confidence = min(1.0, len(signals) * 0.2 + (0.3 if context.get("flood_risk", 0) > 0.5 else 0))
            if confidence > 0.6:
                event = IncidentDetected(
                    event_id=str(uuid.uuid4()),
                    source=self.name,
                    incident_type="Flash Flood" if "flood" in "".join(signals).lower() else "General Emergency",
                    latitude=latitude,
                    longitude=longitude,
                    severity="CRITICAL" if confidence > 0.8 else "HIGH",
                    confidence=confidence,
                    signals=signals
                )
                await self.publish(event)
                await world_model.add_node(
                    label="Incident",
                    properties={
                        "type": event.incident_type,
                        "severity": event.severity,
                        "confidence": event.confidence,
                        "lat": latitude,
                        "lng": longitude,
                        "status": "DETECTED"
                    },
                    node_id=event.event_id
                )
