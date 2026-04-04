from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from urllib.parse import quote_plus, urlparse
import hashlib
import secrets
import certifi

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', '')
if not mongo_url:
    logging.error("MONGO_URL environment variable is not set!")
    raise Exception("MONGO_URL environment variable is required")

# Auto-encode username/password if they contain special characters
try:
    if '@' in mongo_url and '://' in mongo_url:
        scheme_end = mongo_url.index('://') + 3
        at_index = mongo_url.rindex('@')
        userinfo = mongo_url[scheme_end:at_index]
        if ':' in userinfo:
            username, password = userinfo.split(':', 1)
            encoded_username = quote_plus(username)
            encoded_password = quote_plus(password)
            mongo_url = mongo_url[:scheme_end] + encoded_username + ':' + encoded_password + mongo_url[at_index:]
except Exception as e:
    logging.warning(f"Could not auto-encode MongoDB URI: {e}")

db_name = os.environ.get('DB_NAME', 'car_rental_db')
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[db_name]

# Create the main app without a prefix
app = FastAPI()

# Root endpoint
@app.get("/")
async def home():
    return {"message": "Car Rental API is running!", "docs": "/docs", "api": "/api/"}

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

# Admin authentication helpers
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

# Store active sessions (in production, use Redis or similar)
active_sessions = {}

def create_session(admin_email: str) -> str:
    token = secrets.token_urlsafe(32)
    active_sessions[token] = {
        "email": admin_email,
        "expires": datetime.utcnow() + timedelta(days=7)
    }
    return token

def verify_token(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    session = active_sessions.get(token)
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    if session["expires"] < datetime.utcnow():
        del active_sessions[token]
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

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

class AdminLogin(BaseModel):
    email: str
    password: str

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str

# Car Routes
@api_router.get("/")
async def root():
    return {"message": "Car Rental API"}

# Admin Routes
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    try:
        admin = await db.admins.find_one({"email": credentials.email})
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not verify_password(credentials.password, admin["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_session(credentials.email)
        return {
            "token": token,
            "email": admin["email"],
            "name": admin.get("name", "")
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/logout")
async def admin_logout(session: dict = Depends(verify_token), authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "")
    if token in active_sessions:
        del active_sessions[token]
    return {"message": "Logged out successfully"}

@api_router.get("/admin/verify")
async def verify_admin(session: dict = Depends(verify_token)):
    return {"email": session["email"], "authenticated": True}

@api_router.get("/admin/stats")
async def get_admin_stats(session: dict = Depends(verify_token)):
    """Get dashboard stats for admin panel"""
    try:
        # Total cars
        total_cars = await db.cars.count_documents({})
        available_cars = await db.cars.count_documents({"availability": True})
        booked_cars = total_cars - available_cars

        # Total bookings
        total_bookings = await db.bookings.count_documents({})
        pending_bookings = await db.bookings.count_documents({"status": "pending"})
        confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})

        # Total revenue
        pipeline_revenue = [
            {"$group": {"_id": None, "totalRevenue": {"$sum": "$totalPrice"}}}
        ]
        revenue_result = await db.bookings.aggregate(pipeline_revenue).to_list(1)
        total_revenue = revenue_result[0]["totalRevenue"] if revenue_result else 0

        # Unique users
        pipeline_users = [
            {"$group": {"_id": "$userEmail"}},
            {"$count": "total"}
        ]
        users_result = await db.bookings.aggregate(pipeline_users).to_list(1)
        total_users = users_result[0]["total"] if users_result else 0

        # Recent bookings (last 10)
        recent_bookings_cursor = db.bookings.find().sort("createdAt", -1).limit(10)
        recent_bookings = await recent_bookings_cursor.to_list(10)

        # All users with their booking stats
        pipeline_user_stats = [
            {
                "$group": {
                    "_id": "$userEmail",
                    "userName": {"$first": "$userName"},
                    "userPhone": {"$first": "$userPhone"},
                    "totalBookings": {"$sum": 1},
                    "totalSpent": {"$sum": "$totalPrice"},
                    "lastBooking": {"$max": "$createdAt"},
                }
            },
            {"$sort": {"totalSpent": -1}}
        ]
        user_stats = await db.bookings.aggregate(pipeline_user_stats).to_list(100)

        return {
            "cars": {
                "total": total_cars,
                "available": available_cars,
                "booked": booked_cars,
            },
            "bookings": {
                "total": total_bookings,
                "pending": pending_bookings,
                "confirmed": confirmed_bookings,
            },
            "revenue": total_revenue,
            "totalUsers": total_users,
            "recentBookings": [booking_helper(b) for b in recent_bookings],
            "userStats": [
                {
                    "email": u["_id"],
                    "name": u["userName"],
                    "phone": u.get("userPhone", ""),
                    "totalBookings": u["totalBookings"],
                    "totalSpent": u["totalSpent"],
                    "lastBooking": u["lastBooking"],
                }
                for u in user_stats
            ],
        }
    except Exception as e:
        logging.error(f"Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/create")
async def create_admin(admin: AdminCreate):
    """Create admin account - should be protected in production"""
    try:
        existing = await db.admins.find_one({"email": admin.email})
        if existing:
            raise HTTPException(status_code=400, detail="Admin already exists")
        
        admin_doc = {
            "email": admin.email,
            "password": hash_password(admin.password),
            "name": admin.name,
            "createdAt": datetime.utcnow().isoformat()
        }
        
        await db.admins.insert_one(admin_doc)
        return {"message": "Admin created successfully", "email": admin.email}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating admin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
async def create_car(car: Car, session: dict = Depends(verify_token)):
    try:
        car_dict = car.dict()
        result = await db.cars.insert_one(car_dict)
        new_car = await db.cars.find_one({"_id": result.inserted_id})
        return car_helper(new_car)
    except Exception as e:
        logging.error(f"Error creating car: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/cars/{car_id}")
async def update_car(car_id: str, car: CarUpdate, session: dict = Depends(verify_token)):
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
async def delete_car(car_id: str, session: dict = Depends(verify_token)):
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

@app.on_event("startup")
async def seed_admin():
    """Auto-create default admin if none exists"""
    try:
        existing = await db.admins.find_one({"email": "admin@carrental.com"})
        if not existing:
            hashed = hashlib.sha256("admin123".encode()).hexdigest()
            await db.admins.insert_one({"email": "admin@carrental.com", "password": hashed})
            logging.info("Default admin account created: admin@carrental.com")
        else:
            logging.info("Admin account already exists")
    except Exception as e:
        logging.error(f"Error seeding admin: {e}")