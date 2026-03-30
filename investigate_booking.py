#!/usr/bin/env python3
"""
Detailed investigation of booking creation issue
"""

import requests
import json
from datetime import datetime, timedelta

BACKEND_URL = "https://fleet-book-11.preview.emergentagent.com/api"

def investigate_booking_issue():
    print("Investigating booking creation issue...")
    print("=" * 50)
    
    # First, get all cars and check their availability
    print("1. Checking all cars and their availability:")
    response = requests.get(f"{BACKEND_URL}/cars")
    if response.status_code == 200:
        cars = response.json()
        print(f"Found {len(cars)} cars:")
        for car in cars:
            print(f"  - {car['name']} (ID: {car['id']}) - Available: {car['availability']}")
        
        # Find an available car
        available_cars = [car for car in cars if car.get('availability', False)]
        print(f"\nAvailable cars: {len(available_cars)}")
        
        if available_cars:
            car_to_book = available_cars[0]
            print(f"Attempting to book: {car_to_book['name']} (ID: {car_to_book['id']})")
            
            # Try to create a booking with this available car
            start_date = datetime.now() + timedelta(days=1)
            end_date = start_date + timedelta(days=3)
            
            booking_data = {
                "carId": car_to_book['id'],
                "carName": car_to_book['name'],
                "userName": "Jane Smith",
                "userEmail": "jane@example.com",
                "userPhone": "+1987654321",
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "totalPrice": car_to_book['pricePerDay'] * 3,
                "status": "pending"
            }
            
            print(f"\n2. Creating booking with data:")
            print(json.dumps(booking_data, indent=2))
            
            response = requests.post(f"{BACKEND_URL}/bookings", json=booking_data)
            print(f"\nBooking creation response: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                booking = response.json()
                print("✅ Booking created successfully!")
                return booking['id']
            else:
                print("❌ Booking creation failed")
                return None
        else:
            print("❌ No available cars found")
            return None
    else:
        print(f"❌ Failed to get cars: {response.status_code}")
        return None

def test_booking_update_api_design():
    """Test the booking update endpoint API design issue"""
    print("\n" + "=" * 50)
    print("3. Testing booking update API design:")
    
    # Get existing bookings
    response = requests.get(f"{BACKEND_URL}/bookings")
    if response.status_code == 200:
        bookings = response.json()
        if bookings:
            booking_id = bookings[0]['id']
            print(f"Testing with booking ID: {booking_id}")
            
            # Test the current API design (query parameter)
            print("\nTesting current API (query parameter):")
            response = requests.put(f"{BACKEND_URL}/bookings/{booking_id}?status=confirmed")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            # Test what should be the proper API design (JSON body)
            print("\nTesting proper API design (JSON body):")
            response = requests.put(f"{BACKEND_URL}/bookings/{booking_id}", json={"status": "cancelled"})
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
        else:
            print("No bookings found to test update")
    else:
        print(f"Failed to get bookings: {response.status_code}")

if __name__ == "__main__":
    booking_id = investigate_booking_issue()
    test_booking_update_api_design()