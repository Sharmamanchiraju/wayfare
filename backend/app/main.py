import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base
from app.core.logger import get_logger

logger = get_logger(__name__)

import asyncio
import subprocess

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up the Trip Planner API...")
    # Run Alembic migrations automatically
    try:
        logger.info("Running database migrations...")
        process = await asyncio.create_subprocess_exec(
            "alembic", "upgrade", "head",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd="/home/sharma/agent-project/backend"
        )
        stdout, stderr = await process.communicate()
        if process.returncode == 0:
            logger.info("Database migrations completed successfully.")
        else:
            logger.error(f"Migration failed: {stderr.decode()}")
    except Exception as e:
        logger.error(f"Failed to run migrations: {e}")

    try:
        import httpx
        from app.config import get_settings
        settings = get_settings()
        if settings.GROQ_API_KEY:
            headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
                if resp.status_code == 200:
                    available = {m["id"] for m in resp.json().get("data", [])}
                    configured = [settings.EXTRACTION_MODEL_NAME, settings.CONVERSATIONAL_MODEL_NAME]
                    if missing := set(configured) - available:
                        raise RuntimeError(f"Models unavailable on this Groq account: {missing}")
                    logger.info(f"Verified configured Groq models are available: {configured}")
    except Exception as e:
        logger.warning(f"Model boot verification warning: {e}")
        
    yield
    # Clean up on shutdown
    logger.info("Shutting down the Trip Planner API...")
    await engine.dispose()

app = FastAPI(
    title="Trip Planner Agent API",
    description="API for the AI-powered Trip Planner",
    version="1.0.0",
    lifespan=lifespan
)

# Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    logger.debug("Root endpoint accessed")
    return {"message": "Trip Planner Agent API is running!"}

# Include routers
from app.routes.auth import router as auth_router
from app.routes.personas import router as personas_router
from app.routes.trips import router as trips_router
from app.routes.chat import router as chat_router
from app.routes.saved_places import router as saved_places_router

app.include_router(auth_router)
app.include_router(personas_router)
app.include_router(trips_router)
app.include_router(chat_router)
app.include_router(saved_places_router)
