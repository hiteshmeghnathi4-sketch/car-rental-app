#!/usr/bin/env python3
"""
Final comprehensive backend test with corrected issues
"""

import requests
import json
from datetime import datetime, timedelta

BACKEND_URL = "https://fleet-book-11.preview.emergentagent.com/api"

def run_final_comprehensive_test():
    print("Final Comprehensive Backend API Test")
    print("=" * 60)
    
    results = {"passed": 0, "failed": 0, "errors": []}
    
    def log_test(name, success, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {name}: {message}")
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["errors"].append(f"{name}: {message}")
    
    # 1. Test API Root
    try:
        response = requests.get(f"{BACKEND_URL}/")
        log_test("API Root", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        log_test("API Root", False, f"Exception: {str(e)}")
    
    # 2. Test GET /cars
    try:
        response = requests.get(f"{BACKEND_URL}/cars")
        cars = response.json() if response.status_code == 200 else []
        log_test("GET /cars", response.status_code == 200, f"Found {len(cars)} cars")
        available_cars = [car for car in cars if car.get('availability', False)]
        print(f"   Available cars: {len(available_cars)}")
    except Exception as e:
        log_test("GET /cars", False, f"Exception: {str(e)}")
        cars = []
        available_cars = []
    
    # 3. Test GET /cars/{id} with existing car
    if cars:
        try:
            car_id = cars[0]['id']
            response = requests.get(f"{BACKEND_URL}/cars/{car_id}")
            log_test("GET /cars/{id}", response.status_code == 200, f"Retrieved car: {cars[0]['name']}")
        except Exception as e:
            log_test("GET /cars/{id}", False, f"Exception: {str(e)}")
    
    # 4. Test POST /cars (create new car)
    car_data = {
        "name": "Test Vehicle Final",
        "make": "Toyota",
        "model": "Camry",
        "year": 2024,
        "pricePerDay": 80.0,
        "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//2Q==",
        "availability": True,
        "location": {
            "address": "456 Test Ave, Test City",
            "lat": 37.7749,
            "lng": -122.4194
        }
    }
    
    created_car_id = None
    try:
        response = requests.post(f"{BACKEND_URL}/cars", json=car_data)
        if response.status_code == 200:
            created_car = response.json()
            created_car_id = created_car['id']
            log_test("POST /cars", True, f"Created car ID: {created_car_id}")
        else:
            log_test("POST /cars", False, f"Status: {response.status_code}")
    except Exception as e:
        log_test("POST /cars", False, f"Exception: {str(e)}")
    
    # 5. Test POST /cars validation (missing fields)
    try:
        response = requests.post(f"{BACKEND_URL}/cars", json={"name": "Incomplete Car"})
        log_test("POST /cars (validation)", response.status_code == 422, f"Validation error: {response.status_code}")
    except Exception as e:
        log_test("POST /cars (validation)", False, f"Exception: {str(e)}")
    
    # 6. Test PUT /cars/{id} (update car)
    if created_car_id:
        try:
            update_data = {"pricePerDay": 90.0, "availability": True}
            response = requests.put(f"{BACKEND_URL}/cars/{created_car_id}", json=update_data)
            log_test("PUT /cars/{id}", response.status_code == 200, f"Updated car price to 90.0")
        except Exception as e:
            log_test("PUT /cars/{id}", False, f"Exception: {str(e)}")
    
    # 7. Test GET /bookings
    try:
        response = requests.get(f"{BACKEND_URL}/bookings")
        bookings = response.json() if response.status_code == 200 else []
        log_test("GET /bookings", response.status_code == 200, f"Found {len(bookings)} bookings")
    except Exception as e:
        log_test("GET /bookings", False, f"Exception: {str(e)}")
        bookings = []
    
    # 8. Test GET /bookings/user/{email}
    try:
        response = requests.get(f"{BACKEND_URL}/bookings/user/john@example.com")
        user_bookings = response.json() if response.status_code == 200 else []
        log_test("GET /bookings/user/{email}", response.status_code == 200, f"Found {len(user_bookings)} bookings for john@example.com")
    except Exception as e:
        log_test("GET /bookings/user/{email}", False, f"Exception: {str(e)}")
    
    # 9. Test POST /bookings (create booking with available car)
    created_booking_id = None
    if available_cars:
        try:
            car_to_book = available_cars[0]
            start_date = datetime.now() + timedelta(days=2)
            end_date = start_date + timedelta(days=2)
            
            booking_data = {
                "carId": car_to_book['id'],
                "carName": car_to_book['name'],
                "userName": "Test User",
                "userEmail": "test@example.com",
                "userPhone": "+1555000000",
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat(),
                "totalPrice": car_to_book['pricePerDay'] * 2,
                "status": "pending"
            }
            
            response = requests.post(f"{BACKEND_URL}/bookings", json=booking_data)
            if response.status_code == 200:
                created_booking = response.json()
                created_booking_id = created_booking['id']
                log_test("POST /bookings", True, f"Created booking ID: {created_booking_id}")
            else:
                log_test("POST /bookings", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("POST /bookings", False, f"Exception: {str(e)}")
    else:
        log_test("POST /bookings", False, "No available cars to book")
    
    # 10. Test POST /bookings validation (invalid car ID)
    try:
        invalid_booking = {
            "carId": "invalid_id_123",
            "carName": "Test Car",
            "userName": "Test User",
            "userEmail": "test@example.com",
            "userPhone": "+1555000000",
            "startDate": datetime.now().isoformat(),
            "endDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "totalPrice": 100.0
        }
        response = requests.post(f"{BACKEND_URL}/bookings", json=invalid_booking)
        log_test("POST /bookings (validation)", response.status_code in [400, 404, 500], f"Validation error: {response.status_code}")
    except Exception as e:
        log_test("POST /bookings (validation)", False, f"Exception: {str(e)}")
    
    # 11. Test PUT /bookings/{id} (update booking status)
    if created_booking_id:
        try:
            response = requests.put(f"{BACKEND_URL}/bookings/{created_booking_id}?status=confirmed")
            log_test("PUT /bookings/{id}", response.status_code == 200, f"Updated booking status")
        except Exception as e:
            log_test("PUT /bookings/{id}", False, f"Exception: {str(e)}")
    elif bookings:
        try:
            booking_id = bookings[0]['id']
            response = requests.put(f"{BACKEND_URL}/bookings/{booking_id}?status=cancelled")
            log_test("PUT /bookings/{id}", response.status_code == 200, f"Updated existing booking status")
        except Exception as e:
            log_test("PUT /bookings/{id}", False, f"Exception: {str(e)}")
    
    # 12. Test DELETE /bookings/{id}
    if created_booking_id:
        try:
            response = requests.delete(f"{BACKEND_URL}/bookings/{created_booking_id}")
            log_test("DELETE /bookings/{id}", response.status_code == 200, "Deleted booking")
        except Exception as e:
            log_test("DELETE /bookings/{id}", False, f"Exception: {str(e)}")
    
    # 13. Test DELETE /cars/{id}
    if created_car_id:
        try:
            response = requests.delete(f"{BACKEND_URL}/cars/{created_car_id}")
            log_test("DELETE /cars/{id}", response.status_code == 200, "Deleted car")
        except Exception as e:
            log_test("DELETE /cars/{id}", False, f"Exception: {str(e)}")
    
    # Print final summary
    print("\n" + "=" * 60)
    print("FINAL TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {results['passed'] + results['failed']}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {results['failed']}")
    
    if results['errors']:
        print("\nFAILED TESTS:")
        for error in results['errors']:
            print(f"  - {error}")
    
    overall_status = "✅ ALL WORKING" if results['failed'] == 0 else "❌ SOME ISSUES"
    print(f"\nOverall Backend Status: {overall_status}")
    
    return results

if __name__ == "__main__":
    run_final_comprehensive_test()