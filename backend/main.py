from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.services.user_service import user_service
from app.api.v1.endpoints import questions, assessment, results

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

app.include_router(questions.router, tags=["questions"]) # Deprecated or kept for backward compatibility if needed
app.include_router(assessment.router, prefix="/api/v1/assessment", tags=["assessment"])
app.include_router(results.router, prefix="/api/v1", tags=["results"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Youth Assessment API"}
