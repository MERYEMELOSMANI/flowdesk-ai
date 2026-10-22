"""
FlowDesk AI - Enterprise Service-Management Platform
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.services.db import init_db
from app.api.routes_ml import router as ml_router
from app.api.routes_tickets import router as tickets_router
from app.api.routes_agents import router as agents_router
from app.api.routes_optimization import router as optimization_router
from app.api.routes_demo import router as demo_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure SQLite database and initial demo state are initialized
    init_db()
    yield

app = FastAPI(
    title="FlowDesk AI API",
    description="Intelligent Enterprise Service Management with ML Ticket Classification and Google OR-Tools CP-SAT Assignment Optimization",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(ml_router, prefix="/api")
app.include_router(tickets_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(optimization_router, prefix="/api")
app.include_router(demo_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FlowDesk AI Backend",
        "version": "1.0.0"
    }
