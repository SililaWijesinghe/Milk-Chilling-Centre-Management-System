import logging

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import check_database
from app.core.errors import AppError, register_exception_handlers
from app.core.security import CurrentUser
from app.schemas.common import Envelope, ok

logging.basicConfig(level=logging.INFO)

settings = get_settings()

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

# ---- Unversioned operational routes -------------------------------------------------
ops = APIRouter(prefix="/api", tags=["ops"])


@ops.get("/health", response_model=Envelope[dict])
def health():
    """Liveness + dependency check. Returns 503 if the database is unreachable."""
    if not check_database():
        raise AppError(503, "DATABASE_UNAVAILABLE", "Database connection failed")
    return ok({"status": "ok", "service": "mccms-api", "version": settings.app_version, "database": "up"})


from app.routers.ai import router as ai_router
from app.routers.chilling_stock import router as stock_router
from app.routers.collections import router as collections_router
from app.routers.dashboard import router as dashboard_router
from app.routers.dispatches import router as dispatches_router
from app.routers.farmers_and_collections import farmers_router
from app.routers.quality import router as quality_router

# ---- Versioned API ------------------------------------------------------------------
v1 = APIRouter(prefix=settings.api_prefix)


@v1.get("/me", response_model=Envelope[dict], tags=["auth"])
def me(user: CurrentUser):
    return ok({"id": user.id, "email": user.email, "role": user.role})


v1.include_router(ai_router)
v1.include_router(dashboard_router)
v1.include_router(farmers_router)
v1.include_router(collections_router)
v1.include_router(stock_router)
v1.include_router(dispatches_router)
v1.include_router(quality_router)

# Mount unversioned /api aliases directly on ops router for compatibility with both /api/... and /api/v1/...
ops.include_router(dashboard_router)
ops.include_router(farmers_router)
ops.include_router(collections_router)
ops.include_router(stock_router)
ops.include_router(dispatches_router)
ops.include_router(quality_router)

app.include_router(ops)
app.include_router(v1)
