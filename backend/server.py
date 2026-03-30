from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def car_helper(car) -> dict:
    return {
        "id": str(car["_id"]),
        "name": car["name"],
        "make": car["make"],
        "model": car["model"],
        "year": car["year"],
        "pricePerDay": car["pricePerDay"],
        "image": car["image"],
        "availability": car["availability"],
        "location": car["location"]
    }

def booking_helper(booking) -> dict:
    return {
        "id": str(booking["_id"]),
        "carId": booking["carId"],
        "carName": booking.get("carName", ""),
        "userName": booking["userName"],
        "userEmail": booking["userEmail"],
        "userPhone": booking.get("userPhone", ""),
        "startDate": booking["startDate"],
        "endDate": booking["endDate"],
        "totalPrice": booking["totalPrice"],
        "status": booking["status"],
        "createdAt": booking["createdAt"]
    }

# Models
class Location(BaseModel):
    address: str
    lat: float
    lng: float

class Car(BaseModel):
    name: str
    make: str
    model: str
    year: int
    pricePerDay: float
    image: str  # base64 string
    availability: bool = True
    location: Location

class CarUpdate(BaseModel):
    name: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    pricePerDay: Optional[float] = None
    image: Optional[str] = None
    availability: Optional[bool] = None
    location: Optional[Location] = None

class Booking(BaseModel):
    carId: str
    carName: str
    userName: str
    userEmail: str
    userPhone: str
    startDate: str
    endDate: str
    totalPrice: float
    status: str = "pending"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# Car Routes
@api_router.get("/")
async def root():
    return {"message": "Car Rental API"}

@api_router.get("/cars")
async def get_cars():
    try:
        cars = await db.cars.find().to_list(1000)
        return [car_helper(car) for car in cars]
    except Exception as e:
        logging.error(f"Error fetching cars: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/cars/{car_id}")
async def get_car(car_id: str):
    try:
        car = await db.cars.find_one({"_id": ObjectId(car_id)})
        if car:
            return car_helper(car)
        raise HTTPException(status_code=404, detail="Car not found")
    except Exception as e:
        logging.error(f"Error fetching car: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/cars")
async def create_car(car: Car):
    try:
        car_dict = car.dict()
        result = await db.cars.insert_one(car_dict)
        new_car = await db.cars.find_one({"_id": result.inserted_id})
        return car_helper(new_car)
    except Exception as e:
        logging.error(f"Error creating car: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/cars/{car_id}")
async def update_car(car_id: str, car: CarUpdate):
    try:
        update_data = {k: v for k, v in car.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No data to update")
        
        result = await db.cars.update_one(
            {"_id": ObjectId(car_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Car not found")
        
        updated_car = await db.cars.find_one({"_id": ObjectId(car_id)})
        return car_helper(updated_car)
    except Exception as e:
        logging.error(f"Error updating car: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/cars/{car_id}")
async def delete_car(car_id: str):
    try:
        result = await db.cars.delete_one({"_id": ObjectId(car_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Car not found")
        return {"message": "Car deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting car: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Booking Routes
@api_router.get("/bookings")
async def get_bookings():
    try:
        bookings = await db.bookings.find().to_list(1000)
        return [booking_helper(booking) for booking in bookings]
    except Exception as e:
        logging.error(f"Error fetching bookings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookings/user/{user_email}")
async def get_user_bookings(user_email: str):
    try:
        bookings = await db.bookings.find({"userEmail": user_email}).to_list(1000)
        return [booking_helper(booking) for booking in bookings]
    except Exception as e:
        logging.error(f"Error fetching user bookings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/bookings")
async def create_booking(booking: Booking):
    try:
        # Check if car exists and is available
        car = await db.cars.find_one({"_id": ObjectId(booking.carId)})
        if not car:
            raise HTTPException(status_code=404, detail="Car not found")
        if not car.get("availability", False):
            raise HTTPException(status_code=400, detail="Car is not available")
        
        booking_dict = booking.dict()
        result = await db.bookings.insert_one(booking_dict)
        new_booking = await db.bookings.find_one({"_id": result.inserted_id})
        return booking_helper(new_booking)
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/bookings/{booking_id}")
async def update_booking_status(booking_id: str, status: str):
    try:
        result = await db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"status": status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        updated_booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
        return booking_helper(updated_booking)
    except Exception as e:
        logging.error(f"Error updating booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    try:
        result = await db.bookings.delete_one({"_id": ObjectId(booking_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"message": "Booking deleted successfully"}
    except Exception as e:
        logging.error(f"Error deleting booking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()