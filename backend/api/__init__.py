import sys
import os

# Add the 'backend' directory to sys.path so that 'api.x.y' imports work 
# even when the app is run from the root directory as 'backend.api.main:app'
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
