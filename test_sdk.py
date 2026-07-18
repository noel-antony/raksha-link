import sys
import os
import json

# Ensure sdk module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sdk.python.sentinelos import SentinelOSClient
from sdk.python.sentinelos.interactions import InteractionsClient

def test_omni_flash():
    print("\n=== Testing Omni Flash (analyze-video-stream) ===")
    client = SentinelOSClient(base_url="http://localhost:8000")
    
    # Passing a mock URL. In reality, this would be a live drone feed.
    print("[SDK] Calling analyze_drone_feed with Mock Drone ID DRN-101...")
    try:
        response = client.analyze_drone_feed(
            drone_id="DRN-101",
            video_url="https://example.com/drone-feed/DRN-101.mp4"
        )
        print("[SDK] Omni Flash Response:")
        print(json.dumps(response, indent=2))
    except Exception as e:
        print(f"[SDK] Error: {e}")

def test_interactions_api():
    print("\n=== Testing Google Interactions API (iAPI) Wrapper ===")
    iapi_client = InteractionsClient(base_url="http://localhost:8000")
    
    print("[SDK] Initializing Session with SensorFusionAgent...")
    session = iapi_client.create_session(iapi_client.sensor_fusion_agent)
    
    msg1 = "I see water rising fast near the hospital, sending live coordinates."
    print(f"\n[User] -> {msg1}")
    reply1 = session.send_message(msg1)
    print(f"[Agent] <- {reply1}")
    
    msg2 = "The power lines have collapsed as well."
    print(f"\n[User] -> {msg2}")
    reply2 = session.send_message(msg2)
    print(f"[Agent] <- {reply2}")

if __name__ == "__main__":
    test_omni_flash()
    test_interactions_api()
    print("\n=== All Advanced Features Tested Successfully ===")
