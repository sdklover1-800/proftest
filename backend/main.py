"""
Main FastAPI application entry point.
Follows the Thin Router pattern - only sets up middleware and routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import admin, assessment, auth, plans, questions, results
from app.core.config import settings


app = FastAPI(title=settings.PROJECT_NAME)

cors_kwargs = {
    "allow_origins": settings.BACKEND_CORS_ORIGINS,
    "allow_credentials": settings.BACKEND_CORS_ALLOW_CREDENTIALS,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.BACKEND_CORS_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.BACKEND_CORS_ORIGIN_REGEX

app.add_middleware(CORSMiddleware, **cors_kwargs)

# API Routes
app.include_router(questions.router, tags=["questions"])
app.include_router(assessment.router, prefix="/api/v1/assessment", tags=["assessment"])
app.include_router(results.router, prefix="/api/v1", tags=["results"])
app.include_router(plans.router, prefix="/api/v1", tags=["plans"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.get("/")
def read_root():
    return {"message": "Welcome to proftest API"}


@app.get("/healthz")
def healthcheck():
    return {"status": "ok"}
