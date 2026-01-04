import logging
import time
from pathlib import Path
from typing import Optional

import sqlalchemy as sa
from alembic import command
from alembic.config import Config

from db.session import engine

logger = logging.getLogger(__name__)


def wait_for_db(retries: int = 30, delay_seconds: float = 1.0) -> None:
    last_error: Optional[Exception] = None
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as connection:
                connection.execute(sa.text("SELECT 1"))
            return
        except Exception as e:
            last_error = e
            logger.warning("DB not ready (%s/%s): %s", attempt, retries, e)
            time.sleep(delay_seconds)
    raise RuntimeError(f"Database not ready after {retries} attempts: {last_error}")


def run_migrations() -> None:
    base_dir = Path(__file__).resolve().parents[1]
    alembic_ini = base_dir / "alembic.ini"
    if not alembic_ini.exists():
        raise RuntimeError(f"Missing Alembic config at {alembic_ini}")

    alembic_cfg = Config(str(alembic_ini))
    alembic_cfg.set_main_option("script_location", str(base_dir / "alembic"))

    wait_for_db()
    command.upgrade(alembic_cfg, "head")
