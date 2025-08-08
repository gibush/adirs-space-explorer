from typing import List

from data.db import SpaceDB
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Source

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = SpaceDB()


@app.get("/api/sources", response_model=List[Source])
def get_sources():
    sources = db.get_all_sources()
    return sources
