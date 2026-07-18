import os
from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from edge.gemma.commander import edge_commander

print("=== Gemma Edge Commander Test ===")
edge_commander.handle_connectivity_loss()
response = edge_commander.process_local_input("We have an elderly patient trapped on the roof in Ward 7, need medical assist.")
print(f"Result: {response}")
