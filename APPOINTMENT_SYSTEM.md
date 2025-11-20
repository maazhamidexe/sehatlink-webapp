# Appointment System Documentation

## Overview

The appointment system enables doctors to conduct appointments with live audio transcription using Deepgram's Speech-to-Text API. After the appointment, OpenAI's API extracts structured data from the transcription and automatically saves it to the Supabase database.

## Features

- **Live Audio Recording**: Capture appointment conversations using the browser's microphone
- **Real-time Transcription**: Convert speech to text using Deepgram API
- **Structured Data Extraction**: Automatically extract appointment details using OpenAI's GPT-4
- **Database Storage**: Save all appointment data to Supabase for future reference
- **User-friendly Interface**: Clean, modern UI with real-time feedback

## How It Works

### 1. Starting an Appointment

From the main dashboard, click on any appointment (previous, upcoming, or follow-up) to navigate to the appointment page.

### 2. Appointment Page

The appointment page displays:
- Doctor's name
- Patient information
- Appointment date and time
- A "Start Appointment" button

### 3. Recording Process

1. **Start Appointment**: Click the "Start Appointment" button
2. **Begin Recording**: Click "Start Recording" to capture audio
3. **Live Transcription**: See real-time transcription as you speak
4. **Stop Recording**: Click "Stop Recording" when the appointment is complete

### 4. Automatic Processing

After stopping the recording, the system automatically:
1. Sends audio to Deepgram for transcription
2. Sends transcript to OpenAI for structured data extraction
3. Saves all data to Supabase database

### 5. Data Extracted

The system extracts the following structured information:

- **Chief Complaint**: Main reason for the visit
- **Symptoms**: Detailed symptom information (name, severity, duration, notes)
- **Diagnosis**: Final diagnosis or medical impression
- **Prescription**: Medications with dosage, frequency, duration, and instructions
- **Lab Tests**: Ordered tests with reasons
- **Vital Signs**: Blood pressure, heart rate, temperature, weight, height
- **Examination Findings**: Physical examination observations
- **Follow-up**: Suggested follow-up date and instructions

## Database Schema

The appointments table includes the following fields:

```sql
appointments (
  id BIGINT PRIMARY KEY,
  doctor_id BIGINT,
  patient_id BIGINT,
  appointment_time TIMESTAMP,
  status VARCHAR,
  notes TEXT,
  transcription TEXT,
  chief_complaint TEXT,
  symptoms JSONB,
  diagnosis TEXT,
  prescription JSONB,
  lab_tests JSONB,
  vital_signs JSONB,
  examination_findings TEXT,
  follow_up_date DATE,
  follow_up_notes TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
)
```

## API Endpoints

### 1. `/api/transcribe` (POST)

Transcribes audio to text using Deepgram.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: audio file (webm format)

**Response:**
```json
{
  "transcript": "transcribed text...",
  "words": [...]
}
```

### 2. `/api/extract-appointment-data` (POST)

Extracts structured data from transcription using OpenAI.

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
```json
{
  "transcript": "appointment transcription..."
}
```

**Response:**
```json
{
  "data": {
    "chief_complaint": "...",
    "symptoms": [...],
    "diagnosis": "...",
    "prescription": [...],
    "lab_tests": [...],
    "vital_signs": {...},
    "examination_findings": "...",
    "follow_up_date": "2024-03-15",
    "follow_up_notes": "..."
  }
}
```

### 3. `/api/save-appointment` (POST)

Saves appointment data to Supabase.

**Request:**
- Method: POST
- Content-Type: application/json
- Body:
```json
{
  "appointmentId": "1",
  "transcription": "...",
  "chief_complaint": "...",
  "symptoms": [...],
  "diagnosis": "...",
  "prescription": [...],
  "lab_tests": [...],
  "vital_signs": {...},
  "examination_findings": "...",
  "follow_up_date": "2024-03-15",
  "follow_up_notes": "..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {...}
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd sehat-link
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `sehat-link` directory:

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
```

See `ENV_SETUP.md` for detailed instructions on obtaining API keys.

### 3. Database Migration

The database migration has already been applied with the following fields added to the `appointments` table:
- transcription
- chief_complaint
- symptoms
- diagnosis
- prescription
- lab_tests
- vital_signs
- examination_findings
- follow_up_date
- follow_up_notes
- started_at
- completed_at

### 4. Run the Application

```bash
npm run dev
```

Navigate to `http://localhost:3000` and click on any appointment to test the system.

## Browser Requirements

- Modern browser with support for:
  - MediaRecorder API
  - getUserMedia API
  - Audio recording capabilities
- Microphone permissions enabled

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **HTTPS**: Use HTTPS in production for secure audio transmission
3. **Permissions**: Request microphone permissions explicitly
4. **Data Privacy**: Ensure compliance with healthcare data regulations (HIPAA, GDPR)
5. **Audio Storage**: Consider whether to store raw audio files or only transcriptions

## Error Handling

The system handles the following error scenarios:

1. **Microphone Access Denied**: Shows error message prompting user to enable permissions
2. **Transcription Failure**: Displays error and allows retry
3. **API Key Missing**: Returns 500 error with configuration message
4. **Network Errors**: Shows error message and maintains transcript data

## Future Enhancements

Potential improvements for the system:

1. **Real-time Streaming**: Use Deepgram's WebSocket API for live streaming transcription
2. **Speaker Diarization**: Identify and label different speakers (doctor vs patient)
3. **Audio Playback**: Allow playback of recorded audio
4. **Edit Transcription**: Enable manual editing of transcripts before saving
5. **Multi-language Support**: Support transcription in multiple languages
6. **Voice Commands**: Enable voice commands for common actions
7. **Audio Quality Check**: Validate audio quality before transcription
8. **Offline Mode**: Cache recordings for later transcription when connection is restored

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure HTTPS connection (required for getUserMedia)
- Verify no other application is using the microphone

### Transcription Fails
- Verify DEEPGRAM_API_KEY is correctly set
- Check API quota and billing status
- Ensure audio format is supported (webm)

### Data Not Saving
- Verify OPENAI_API_KEY is correctly set
- Check Supabase connection
- Verify appointment ID exists in database
- Check browser console for detailed error messages

## Support

For issues or questions, please refer to:
- [Deepgram Documentation](https://developers.deepgram.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

