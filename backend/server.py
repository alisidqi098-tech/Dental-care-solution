from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class DemoBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    clinic: str
    email: str
    phone: str
    chairs: Optional[str] = None
    date: str
    time_slot: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DemoBookingCreate(BaseModel):
    name: str
    clinic: str
    email: str
    phone: str
    chairs: Optional[str] = None
    date: str
    time_slot: str
    notes: Optional[str] = None


@api_router.get("/")
async def root():
    return {"message": "Dental Care Solution AI API"}


@api_router.post("/demo-booking", response_model=DemoBooking)
async def create_demo_booking(input: DemoBookingCreate):
    booking = DemoBooking(**input.model_dump())
    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.demo_bookings.insert_one(doc)
    return booking


@api_router.get("/demo-bookings", response_model=List[DemoBooking])
async def get_demo_bookings():
    bookings = await db.demo_bookings.find({}, {"_id": 0}).to_list(1000)
    for b in bookings:
        if isinstance(b.get('created_at'), str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return bookings


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
