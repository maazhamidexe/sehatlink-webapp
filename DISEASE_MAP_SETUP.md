# Disease Map Setup Guide

This guide explains the Disease Distribution Map feature on the Doctor Dashboard.

## Overview

The Disease Map displays real-time disease tracking across Pakistan using:
- **Data Source**: Supabase `disease_reports` table
- **Map API**: Google Maps JavaScript API (Interactive)
- **Theme**: Custom dark mode styling
- **Markers**: Color-coded circular dots for each disease report
- **Coverage**: Major cities in Pakistan with coordinate mapping

## Database Schema

The feature uses the existing `disease_reports` table:

```sql
disease_reports (
  id              BIGINT PRIMARY KEY
  patient_id      BIGINT (FK to patients)
  disease_name    TEXT
  reported_city   TEXT
  report_date     TIMESTAMPTZ
  severity_level  TEXT (nullable)
)
```

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Maps JavaScript API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 2. Configure Environment Variable

Create or update `.env.local` in your project root:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important**: Restart your development server after adding the key!

### 3. Restrict API Key (Recommended)

For security and cost control:

1. In Google Cloud Console, click "Restrict Key" for your API key
2. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `localhost:3000/*` (development)
   - Add: `yourdomain.com/*` (production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose "Maps JavaScript API"

### 4. Verify Setup

1. Start dev server: `npm run dev`
2. Login as a doctor
3. Navigate to Doctor Dashboard
4. You should see the disease map with markers

## Supported Cities

The system includes coordinates for 35+ major Pakistani cities:

- Karachi, Lahore, Islamabad, Rawalpindi
- Faisalabad, Multan, Peshawar, Quetta
- Sialkot, Gujranwala, Hyderabad, Bahawalpur
- And more...

Cities not in the mapping won't appear on the map but will show in the reports table.

## Disease Color Coding

| Disease | Marker Color |
|---------|--------------|
| Dengue / Dengue Fever | Red |
| Malaria | Blue |
| Typhoid | Green |
| Hepatitis | Yellow |
| Tuberculosis / TB | Purple |
| COVID-19 / COVID | Orange |
| Flu / Influenza | Cyan |
| Cholera | Brown |
| Measles | Pink |
| Hypertension | Dark Blue |
| Diabetes | Teal |
| Asthma | Light Blue |
| Others | Gray |

## Severity Levels

Reports are categorized by severity:
- **Critical**: Red badge
- **Severe**: Orange badge
- **Moderate**: Yellow badge
- **Mild**: Green badge

## Features

### 1. Interactive Map
- **Fully interactive** Google Maps with zoom, pan, and drag
- **Custom dark theme** optimized for dark mode UI
- **Circular dot markers** for each disease report
- **Color-coded** by disease type
- **Click markers** to see detailed info windows
- **Auto-fits bounds** to show all disease reports

### 2. Statistics Panel
- Total cases per disease
- Number of affected cities
- Count of critical/severe cases

### 3. Reports Table
- Recent 15 disease reports
- Disease type, city, severity, date
- Color-coded for easy identification

### 4. Real-time Updates
- Refresh button to reload data
- Automatic data fetching on page load

## API Endpoint

### GET `/api/disease-reports`

**Response:**
```json
{
  "success": true,
  "total": 20,
  "data": [
    {
      "id": 1,
      "disease_type": "Dengue Fever",
      "city": "Lahore",
      "latitude": 31.5204,
      "longitude": 74.3587,
      "severity_level": "Severe",
      "report_date": "2025-11-13T15:35:44.055032Z",
      "has_coordinates": true
    }
  ]
}
```

## Cost Information

Google Maps JavaScript API pricing:
- **Free tier**: 28,000 map loads/month
- **Additional**: $7.00 per 1,000 requests

For typical usage, the free tier is sufficient. Interactive maps are more expensive than static maps but provide a much better user experience.

## Troubleshooting

### Map shows "Map unavailable"
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Restart your development server
- Verify the API key is correct (no extra spaces/quotes)

### No markers on map
- Check if disease reports exist in database
- Verify city names match supported cities list
- Check browser console for errors

### API key errors in console
- Ensure Maps Static API is enabled in Google Cloud
- Check API key restrictions aren't blocking requests
- Verify billing is enabled on your Google Cloud project

### "Failed to fetch disease reports" error
- Check Supabase connection in `lib/supabase.ts`
- Verify `disease_reports` table exists
- Check table permissions (RLS policies)

## Adding More Cities

To add more cities to the coordinate mapping, edit:

`app/api/disease-reports/route.ts`

Add entries to the `CITY_COORDINATES` object:

```typescript
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // ... existing cities
  "new_city_name": { lat: 00.0000, lng: 00.0000 },
}
```

City names are normalized (lowercase, spaces/hyphens become underscores).

## Security Best Practices

1. ✅ Restrict API keys to specific domains
2. ✅ Set daily usage quotas in Google Cloud
3. ✅ Use environment variables (never commit API keys)
4. ✅ Enable HTTPS in production
5. ✅ Monitor API usage regularly

## Sample Data

To test with sample data, run this SQL in Supabase:

```sql
-- Note: Make sure patient_id references exist in your patients table
INSERT INTO disease_reports (patient_id, disease_name, reported_city, severity_level) VALUES
  (1, 'Dengue Fever', 'Lahore', 'Severe'),
  (2, 'Malaria', 'Karachi', 'Moderate'),
  (3, 'Typhoid', 'Islamabad', 'Mild'),
  (1, 'Hypertension', 'Lahore', 'Moderate'),
  (4, 'Asthma', 'Peshawar', 'Critical');
```

## Support

For issues:
1. Check browser console for error messages
2. Verify environment variables are set correctly
3. Check Supabase logs for database errors
4. Review Google Cloud Console for API issues
