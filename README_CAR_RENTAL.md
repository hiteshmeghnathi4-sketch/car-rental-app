# Car Rental App 🚗

A full-stack mobile car rental application built with Expo (React Native), FastAPI, and MongoDB.

## Features

### For Users
- **Browse Cars**: View all available cars with details, pricing, and location
- **Car Details**: See comprehensive information including pickup location on an interactive map
- **Book Cars**: Select rental dates and complete booking with personal information
- **My Bookings**: View all your bookings filtered by email

### For Admins
- **Car Management**: Add, edit, and delete cars from inventory
- **Toggle Availability**: Mark cars as available or unavailable
- **Image Upload**: Upload car photos directly from your device

## Tech Stack

**Frontend (Mobile):**
- Expo / React Native
- React Navigation (Bottom Tabs + Stack)
- React Native Maps (for location display)
- Expo Image Picker (for car images)
- AsyncStorage (for user email persistence)
- Axios (for API calls)

**Backend:**
- FastAPI (Python)
- MongoDB (Database)
- Motor (Async MongoDB driver)

## App Structure

### Screens
1. **Browse Tab** (`/app/frontend/app/(tabs)/index.tsx`)
   - Lists all cars with image, price, availability
   - Pull to refresh
   - Click to view details

2. **Car Detail** (`/app/frontend/app/car-detail.tsx`)
   - Full car information
   - Interactive map showing pickup location
   - Book button (if available)

3. **Booking** (`/app/frontend/app/booking.tsx`)
   - User information form
   - Date picker for rental period
   - Price calculation
   - Booking summary

4. **My Bookings Tab** (`/app/frontend/app/(tabs)/bookings.tsx`)
   - Email input (stored locally)
   - List of user's bookings
   - Status indicators

5. **Admin Tab** (`/app/frontend/app/(tabs)/admin.tsx`)
   - Car inventory management
   - Toggle availability
   - Delete cars
   - Add car button

6. **Add Car** (`/app/frontend/app/add-car.tsx`)
   - Car information form
   - Image picker
   - Location coordinates

## API Endpoints

### Cars
- `GET /api/cars` - Get all cars
- `GET /api/cars/{id}` - Get car by ID
- `POST /api/cars` - Create new car
- `PUT /api/cars/{id}` - Update car
- `DELETE /api/cars/{id}` - Delete car

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/user/{email}` - Get bookings by user email
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}` - Update booking status
- `DELETE /api/bookings/{id}` - Delete booking

## Sample Data

The app comes with 3 sample cars:
1. **Luxury Sedan** - Tesla Model S 2024 - $120/day (Available)
2. **Economy Hatchback** - Honda Civic 2023 - $45/day (Available)
3. **Premium SUV** - BMW X5 2024 - $95/day (Unavailable)

And 1 sample booking for testing.

## Testing

**Backend Testing:** ✅ All 11 endpoints tested and working
- Car CRUD operations
- Booking CRUD operations
- Validation and error handling

**Test User:**
- Email: `john@example.com`
- Has 1 sample booking

## How to Use

### As a Customer:
1. Open the app and browse available cars
2. Tap on a car to see details and location
3. Tap "Book Now" if available
4. Fill in your details and select dates
5. Submit booking
6. Check "My Bookings" tab to see your bookings (enter your email)

### As an Admin:
1. Go to "Admin" tab
2. View all cars in inventory
3. Toggle availability with the status button
4. Delete cars with the trash icon
5. Add new cars using the blue + button
6. Fill in car details and upload photo

## Important Notes

- **Images**: All car images are stored as base64 strings for simplicity
- **User Authentication**: Currently uses email-based identification (no password required)
- **Location**: Requires latitude and longitude coordinates (can get from Google Maps)
- **Permissions**: App requests camera roll and location permissions on first use
- **Payment**: Not integrated (bookings are tracked but payment happens offline)

## Future Enhancements

- User authentication with login/signup
- Payment integration (Stripe/PayPal)
- Real-time availability checking
- Car search and filters
- GPS-based car location finder
- Damage reporting with photos
- Rating and review system
- Push notifications for booking confirmations
- Admin dashboard for analytics

---

Built with ❤️ using Expo and FastAPI
