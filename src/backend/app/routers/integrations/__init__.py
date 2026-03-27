"""Integration routers package.

Exports a single `router` that aggregates all integration sub-routers.
"""

from fastapi import APIRouter

from .config import router as config_router
from .openmesh import router as openmesh_router
from .openmind import router as openmind_router
from .openshield import router as openshield_router
from .opentrace import router as opentrace_router

router = APIRouter()
router.include_router(config_router)
router.include_router(opentrace_router)
router.include_router(openmesh_router)
router.include_router(openmind_router)
router.include_router(openshield_router)
