import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.db import init_pool, close_pool
from app.routers import auth_router, users, artists, events, notifications
from jobs.scheduler import init_scheduler, shutdown_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_pool()
    init_scheduler()
    yield
    shutdown_scheduler()
    close_pool()


app = FastAPI(title="Concert Discovery API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(users.router)
app.include_router(artists.router)
app.include_router(events.router)
app.include_router(notifications.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
