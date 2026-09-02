"""
Keyless Healer - Root Entrypoint
Forwarding directly to keyless_healer.app
"""

import sys
from pathlib import Path

# Ensure workspace root and keyless_healer are in python path
workspace_root = Path(__file__).resolve().parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

from keyless_healer.app import main

if __name__ == "__main__":
    main()
