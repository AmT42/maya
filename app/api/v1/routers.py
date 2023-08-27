from fastapi import APIRouter

from .endpoints import *

router = APIRouter()

router.include_router(users.router, prefix = "/users", tags = ["users"])
router.include_router(document.router, prefix = "/documents", tags = ["documents"])
router.include_router(validation.router, prefix = "/validation", tags = ["validation"])