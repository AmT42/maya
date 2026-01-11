"""Chroma DB service package.

Keep this package import-side-effect free: initialization must stay lazy in
`db.py` so the backend can run in `MAYA_DEV_MODE` without requiring Chroma (and
without triggering Chroma telemetry on import).
"""

