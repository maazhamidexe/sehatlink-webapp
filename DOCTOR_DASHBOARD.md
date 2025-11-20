# Doctor Dashboard Documentation

## Overview
The doctor dashboard allows healthcare professionals to manage their appointments and view patient information.

## Features

### 1. Doctor Authentication
- **Login/Signup Page**: `/auth/doctor`
- Comprehensive signup form with:
  - Basic information (name, email, password, license number)
  - Specialization
  - Years of experience
  - City
  - Affiliation options:
    - Existing Hospital
    - Register New Hospital
    - Private Clinic

### 2. Doctor Dashboard
- **Dashboard Page**: `/doctor/dashboard`
- Features:
  - View all appointments from Supabase
  - Statistics cards (Total, Pending, Confirmed appointments)
  - Detailed appointment cards with:
    - Patient information
    - Appointment date and time
    - Status badges
    - Reason and notes

## API Routes

### Doctor Authentication
- `POST /api/proxy/doctor/signup` - Register new doctor
- `POST /api/proxy/doctor/login` - Login doctor

### Hospital Management
- `GET /api/proxy/hospitals/list` - Get list of all hospitals

### Appointments
- `GET /api/doctor/appointments` - Get all appointments from Supabase

## Environment Variables

Make sure your `.env.local` includes:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://cpifquoelejdrtlqycsj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Usage

### For Patients
1. Navigate to `/auth` for patient login/signup
2. Link to doctor login is provided at the bottom

### For Doctors
1. Navigate to `/auth/doctor` for doctor login/signup
2. Complete the detailed registration form
3. After login, access dashboard at `/doctor/dashboard`
4. View and manage appointments

## Doctor Signup Payload Structure

```typescript
{
  name: string
  licence_no: string
  email: string
  password: string
  specialization?: string | null
  affiliation_type: "Hospital" | "Register New Hospital" | "Private Clinic"
  experience_years: number
  city: string
  existing_hospital_id?: number | null
  new_hospital_details?: {
    name: string
    address: string
    city: string
    contact_no?: string | null
  } | null
  clinic_address?: string | null
}
```

## Authentication Flow

1. Doctor signs up or logs in
2. Access token is stored in localStorage as `doctor_token`
3. User type is stored as `user_type: "doctor"`
4. Dashboard checks for token and redirects if not authenticated
5. Logout clears all tokens and user type

## Supabase Schema

The dashboard expects an `appointments` table with these fields:
- `id` (uuid)
- `patient_name` (text)
- `patient_email` (text)
- `appointment_date` (date)
- `appointment_time` (text)
- `status` (text)
- `reason` (text, optional)
- `notes` (text, optional)
- `created_at` (timestamp)

## Navigation

- Patient Auth: `/auth`
- Doctor Auth: `/auth/doctor`
- Doctor Dashboard: `/doctor/dashboard`
