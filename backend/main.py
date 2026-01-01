from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import assessment, auth, questions, results
from app.core.config import settings

# We import models to ensure Alembic/SQLAlchemy sees them if we were using it here,
# although main.py usually doesn't need models directly.

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    questions.router, tags=["questions"]
)  # Deprecated or kept for backward compatibility if needed
app.include_router(assessment.router, prefix="/api/v1/assessment", tags=["assessment"])
app.include_router(results.router, prefix="/api/v1", tags=["results"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])


@app.get("/")
def read_root():
    return {"message": "Welcome to proftest API"}
