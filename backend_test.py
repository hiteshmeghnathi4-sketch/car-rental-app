#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Car Rental App
Tests all CRUD endpoints for Cars and Bookings
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Backend URL from environment
BACKEND_URL = "https://fleet-book-11.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = {
            "cars": {},
            "bookings": {},
            "summary": {"passed": 0, "failed": 0, "errors": []}
        }
        self.created_car_id = None
        self.created_booking_id = None
        self.existing_car_ids = []
        self.existing_booking_ids = []

    def log_result(self, test_name, success, message="", response_data=None):
        """Log test result"""
        status = "PASS" if success else "FAIL"
        print(f"[{status}] {test_name}: {message}")
        
        if success:
            self.test_results["summary"]["passed"] += 1
        else:
            self.test_results["summary"]["failed"] += 1
            self.test_results["summary"]["errors"].append(f"{test_name}: {message}")
        
        if response_data:
            print(f"  Response: {json.dumps(response_data, indent=2)}")

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Root", True, f"Status: {response.status_code}", data)
                return True
            else:
                self.log_result("API Root", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Root", False, f"Exception: {str(e)}")
            return False

    def test_get_all_cars(self):
        """Test GET /api/cars - list all cars"""
        try:
            response = requests.get(f"{self.base_url}/cars")
            if response.status_code == 200:
                cars = response.json()
                self.existing_car_ids = [car["id"] for car in cars if "id" in car]
                self.log_result("GET /cars", True, f"Found {len(cars)} cars", {"count": len(cars)})
                return True, cars
            else:
                self.log_result("GET /cars", False, f"Status: {response.status_code}")
                return False, []
        except Exception as e:
            self.log_result("GET /cars", False, f"Exception: {str(e)}")
            return False, []

    def test_get_car_by_id(self, car_id):
        """Test GET /api/cars/{id} - get specific car"""
        try:
            response = requests.get(f"{self.base_url}/cars/{car_id}")
            if response.status_code == 200:
                car = response.json()
                self.log_result("GET /cars/{id}", True, f"Retrieved car: {car.get('name', 'Unknown')}")
                return True, car
            elif response.status_code == 404:
                self.log_result("GET /cars/{id}", False, "Car not found (404)")
                return False, None
            else:
                self.log_result("GET /cars/{id}", False, f"Status: {response.status_code}")
                return False, None
        except Exception as e:
            self.log_result("GET /cars/{id}", False, f"Exception: {str(e)}")
            return False, None

    def test_create_car(self):
        """Test POST /api/cars - create new car"""
        car_data = {
            "name": "Test BMW X5",
            "make": "BMW",
            "model": "X5",
            "year": 2023,
            "pricePerDay": 150.0,
            "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            "availability": True,
            "location": {
                "address": "123 Test Street, Test City",
                "lat": 40.7128,
                "lng": -74.0060
            }
        }
        
        try:
            response = requests.post(f"{self.base_url}/cars", json=car_data)
            if response.status_code == 200:
                car = response.json()
                self.created_car_id = car.get("id")
                self.log_result("POST /cars", True, f"Created car with ID: {self.created_car_id}")
                return True, car
            else:
                self.log_result("POST /cars", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
        except Exception as e:
            self.log_result("POST /cars", False, f"Exception: {str(e)}")
            return False, None

    def test_create_car_validation(self):
        """Test POST /api/cars with invalid data"""
        invalid_data = {
            "name": "Test Car",
            # Missing required fields
        }
        
        try:
            response = requests.post(f"{self.base_url}/cars", json=invalid_data)
            if response.status_code == 422:  # Validation error
                self.log_result("POST /cars (validation)", True, "Validation error returned as expected")
                return True
            else:
                self.log_result("POST /cars (validation)", False, f"Expected 422, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("POST /cars (validation)", False, f"Exception: {str(e)}")
            return False

    def test_update_car(self, car_id):
        """Test PUT /api/cars/{id} - update car"""
        update_data = {
            "pricePerDay": 175.0,
            "availability": False
        }
        
        try:
            response = requests.put(f"{self.base_url}/cars/{car_id}", json=update_data)
            if response.status_code == 200:
                car = response.json()
                self.log_result("PUT /cars/{id}", True, f"Updated car price to {car.get('pricePerDay')}")
                return True, car
            elif response.status_code == 404:
                self.log_result("PUT /cars/{id}", False, "Car not found (404)")
                return False, None
            else:
                self.log_result("PUT /cars/{id}", False, f"Status: {response.status_code}")
                return False, None
        except Exception as e:
            self.log_result("PUT /cars/{id}", False, f"Exception: {str(e)}")
            return False, None

    def test_delete_car(self, car_id):
        """Test DELETE /api/cars/{id} - delete car"""
        try:
            response = requests.delete(f"{self.base_url}/cars/{car_id}")
            if response.status_code == 200:
                result = response.json()
                self.log_result("DELETE /cars/{id}", True, result.get("message", "Car deleted"))
                return True
            elif response.status_code == 404:
                self.log_result("DELETE /cars/{id}", False, "Car not found (404)")
                return False
            else:
                self.log_result("DELETE /cars/{id}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("DELETE /cars/{id}", False, f"Exception: {str(e)}")
            return False

    def test_get_all_bookings(self):
        """Test GET /api/bookings - list all bookings"""
        try:
            response = requests.get(f"{self.base_url}/bookings")
            if response.status_code == 200:
                bookings = response.json()
                self.existing_booking_ids = [booking["id"] for booking in bookings if "id" in booking]
                self.log_result("GET /bookings", True, f"Found {len(bookings)} bookings")
                return True, bookings
            else:
                self.log_result("GET /bookings", False, f"Status: {response.status_code}")
                return False, []
        except Exception as e:
            self.log_result("GET /bookings", False, f"Exception: {str(e)}")
            return False, []

    def test_get_user_bookings(self, email="john@example.com"):
        """Test GET /api/bookings/user/{email} - get bookings for specific user"""
        try:
            response = requests.get(f"{self.base_url}/bookings/user/{email}")
            if response.status_code == 200:
                bookings = response.json()
                self.log_result("GET /bookings/user/{email}", True, f"Found {len(bookings)} bookings for {email}")
                return True, bookings
            else:
                self.log_result("GET /bookings/user/{email}", False, f"Status: {response.status_code}")
                return False, []
        except Exception as e:
            self.log_result("GET /bookings/user/{email}", False, f"Exception: {str(e)}")
            return False, []

    def test_create_booking(self, car_id):
        """Test POST /api/bookings - create new booking"""
        start_date = datetime.now() + timedelta(days=1)
        end_date = start_date + timedelta(days=3)
        
        booking_data = {
            "carId": car_id,
            "carName": "Test BMW X5",
            "userName": "John Doe",
            "userEmail": "john@example.com",
            "userPhone": "+1234567890",
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "totalPrice": 450.0,
            "status": "pending"
        }
        
        try:
            response = requests.post(f"{self.base_url}/bookings", json=booking_data)
            if response.status_code == 200:
                booking = response.json()
                self.created_booking_id = booking.get("id")
                self.log_result("POST /bookings", True, f"Created booking with ID: {self.created_booking_id}")
                return True, booking
            else:
                self.log_result("POST /bookings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False, None
        except Exception as e:
            self.log_result("POST /bookings", False, f"Exception: {str(e)}")
            return False, None

    def test_create_booking_validation(self):
        """Test POST /api/bookings with invalid car ID"""
        booking_data = {
            "carId": "invalid_car_id",
            "carName": "Test Car",
            "userName": "John Doe",
            "userEmail": "john@example.com",
            "userPhone": "+1234567890",
            "startDate": datetime.now().isoformat(),
            "endDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "totalPrice": 100.0
        }
        
        try:
            response = requests.post(f"{self.base_url}/bookings", json=booking_data)
            if response.status_code in [404, 400, 500]:  # Expected error for invalid car ID
                self.log_result("POST /bookings (validation)", True, f"Validation error returned as expected: {response.status_code}")
                return True
            else:
                self.log_result("POST /bookings (validation)", False, f"Expected error, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("POST /bookings (validation)", False, f"Exception: {str(e)}")
            return False

    def test_update_booking_status(self, booking_id):
        """Test PUT /api/bookings/{id} - update booking status"""
        # Note: The API expects just a status string, not a JSON body
        try:
            response = requests.put(f"{self.base_url}/bookings/{booking_id}?status=confirmed")
            if response.status_code == 200:
                booking = response.json()
                self.log_result("PUT /bookings/{id}", True, f"Updated booking status to {booking.get('status')}")
                return True, booking
            elif response.status_code == 404:
                self.log_result("PUT /bookings/{id}", False, "Booking not found (404)")
                return False, None
            else:
                self.log_result("PUT /bookings/{id}", False, f"Status: {response.status_code}")
                return False, None
        except Exception as e:
            self.log_result("PUT /bookings/{id}", False, f"Exception: {str(e)}")
            return False, None

    def test_delete_booking(self, booking_id):
        """Test DELETE /api/bookings/{id} - delete booking"""
        try:
            response = requests.delete(f"{self.base_url}/bookings/{booking_id}")
            if response.status_code == 200:
                result = response.json()
                self.log_result("DELETE /bookings/{id}", True, result.get("message", "Booking deleted"))
                return True
            elif response.status_code == 404:
                self.log_result("DELETE /bookings/{id}", False, "Booking not found (404)")
                return False
            else:
                self.log_result("DELETE /bookings/{id}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("DELETE /bookings/{id}", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print(f"Starting Backend API Tests for: {self.base_url}")
        print("=" * 60)
        
        # Test API root
        self.test_api_root()
        
        # Test Cars API
        print("\n--- CARS API TESTS ---")
        
        # Get all cars (should have sample data)
        success, cars = self.test_get_all_cars()
        
        # Test get car by ID with existing car
        if self.existing_car_ids:
            self.test_get_car_by_id(self.existing_car_ids[0])
        
        # Test create new car
        success, new_car = self.test_create_car()
        
        # Test car validation
        self.test_create_car_validation()
        
        # Test update car (use created car or existing car)
        car_id_to_update = self.created_car_id or (self.existing_car_ids[0] if self.existing_car_ids else None)
        if car_id_to_update:
            self.test_update_car(car_id_to_update)
        
        # Test Bookings API
        print("\n--- BOOKINGS API TESTS ---")
        
        # Get all bookings
        success, bookings = self.test_get_all_bookings()
        
        # Test get user bookings
        self.test_get_user_bookings("john@example.com")
        
        # Test create booking (need a valid car ID)
        car_id_for_booking = self.created_car_id or (self.existing_car_ids[0] if self.existing_car_ids else None)
        if car_id_for_booking:
            success, new_booking = self.test_create_booking(car_id_for_booking)
        
        # Test booking validation
        self.test_create_booking_validation()
        
        # Test update booking status
        booking_id_to_update = self.created_booking_id or (self.existing_booking_ids[0] if self.existing_booking_ids else None)
        if booking_id_to_update:
            self.test_update_booking_status(booking_id_to_update)
        
        # Cleanup: Delete created resources
        print("\n--- CLEANUP ---")
        if self.created_booking_id:
            self.test_delete_booking(self.created_booking_id)
        
        if self.created_car_id:
            self.test_delete_car(self.created_car_id)
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['summary']['passed'] + self.test_results['summary']['failed']}")
        print(f"Passed: {self.test_results['summary']['passed']}")
        print(f"Failed: {self.test_results['summary']['failed']}")
        
        if self.test_results['summary']['errors']:
            print("\nFAILED TESTS:")
            for error in self.test_results['summary']['errors']:
                print(f"  - {error}")
        
        print("\nBackend API Status:", "✅ WORKING" if self.test_results['summary']['failed'] == 0 else "❌ ISSUES FOUND")

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()