# Saurabh's Rental Car Service

A full-stack web application for managing car rentals, bookings, and dashboard analytics for a rental car business.

## Project Overview

This project provides a robust solution for a car rental business, featuring a React frontend and a Node.js/Express backend. It allows users to browse cars, make bookings, check availability, and includes an administrative dashboard for managing operations.

## Technology Stack

### Frontend
- **Framework:** React (v19)
- **Routing:** React Router DOM
- **Build Tool:** Vite
- **Linting:** oxlint

### Backend
- **Environment:** Node.js (v20.19.0+)
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Utilities:** Nodemailer (for emails), PDFKit (for generating receipts)

## Getting Started

### Prerequisites
- Node.js (>=20.19.0)
- MongoDB

### Installation & Setup

1. **Clone the repository (if applicable)**
   ```bash
   git clone <repository-url>
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   - Create a `.env` file in the `backend` directory with necessary environment variables (e.g., `PORT`, MongoDB connection string, email credentials).
   - Seed the database (optional but recommended):
     ```bash
     npm run seed
     ```
   - Start the backend development server:
     ```bash
     npm run dev
     ```
   - The backend API will run on `http://localhost:4000`.

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```
   - Start the frontend development server:
     ```bash
     npm run dev
     ```

## API Endpoints

The backend provides the following main API route prefixes:
- `/api/cars` - Manage car inventory
- `/api/bookings` - Manage customer bookings
- `/api/dashboard` - Get analytics and business metrics
- `/api/availability` - Check car availability and schedule
- `/api/calendar` - Calendar view for bookings
- `/api/receipt` - Generate and retrieve booking receipts (PDF)

## Features
- Complete car inventory management
- Booking workflow and receipt generation (PDF)
- Administrative dashboard
- Calendar view for tracking reservations
- Email notifications integration

## License

This project is proprietary and confidential.

Ankit Testing 2