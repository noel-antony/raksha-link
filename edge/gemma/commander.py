import os
from typing import Dict, Any, List
from google import genai

class GemmaEdgeCommander:
    """
    Local-first execution unit for SentinelOS.
    Operates on device when cloud connectivity is lost.
    Simulates Gemma 4 using Gemini 2.5 Flash.
    """
    def __init__(self):
        self.is_offline = False
        self.local_cache: Dict[str, Any] = {}
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("[GemmaEdge] Warning: GEMINI_API_KEY not found in environment.")

    def handle_connectivity_loss(self):
        """Triggered when the device loses connection to the Event Bus."""
        self.is_offline = True
        print("[GemmaEdge] Cloud connectivity lost. Taking over mission coordination locally.")

    def process_local_input(self, input_data: str) -> str:
        """
        Processes local mission data using a lightweight local model (simulated via Gemini 2.5 Flash).
        """
        if not self.is_offline:
            return "Online: Handled by cloud."
        
        print(f"[GemmaEdge] Processing locally with simulated Gemma 4: {input_data}")
        
        try:
            client = genai.Client(api_key=self.api_key)
            prompt = f"""
            You are Gemma 4, an on-device lightweight edge AI running inside the SentinelOS Emergency Response App. 
            The device has lost cloud connectivity, and you are operating completely offline.
            
            Based on the following user input, generate a concise, actionable routing or coordination decision.
            Keep it under 2 sentences. 
            
            User Input: "{input_data}"
            """
            
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
            )
            decision = f"Gemma: {response.text.strip()}"
            self.local_cache[input_data] = decision
            return decision
            
        except Exception as e:
            print(f"[GemmaEdge] Error calling Gemini API: {e}")
            if "help" in input_data.lower() or "medical" in input_data.lower():
                decision = "Gemma: Medical assistance requested. Routing nearest local responder based on cached mesh network data."
            else:
                decision = "Gemma: Command acknowledged and cached for sync."
            self.local_cache[input_data] = decision
            return decision

    def sync_on_reconnect(self) -> List[Dict[str, Any]]:
        """Returns cached local decisions to the cloud Event Bus upon reconnection."""
        self.is_offline = False
        print("[GemmaEdge] Cloud connectivity restored. Syncing local decisions to World Model.")
        sync_data = list(self.local_cache.values())
        self.local_cache.clear()
        return sync_data

# Global instance for edge apps
edge_commander = GemmaEdgeCommander()
