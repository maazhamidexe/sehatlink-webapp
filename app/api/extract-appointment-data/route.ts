import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const { transcript } = await request.json()

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a medical transcription assistant. Your task is to:
1. First, translate the transcription from Urdu (or any other language) to English if needed
2. Then extract structured medical data from the English translation

The transcription may be in Urdu, English, or a mix of both. Always translate any Urdu text to English first, then extract the structured data.

Return a JSON object matching the appointments table schema in Supabase:
{
  "chief_complaint": "Main reason for visit (TEXT field, in English)",
  "symptoms": [
    {
      "name": "symptom name (in English)",
      "severity": "mild/moderate/severe",
      "duration": "duration description (in English)",
      "notes": "additional notes (in English)"
    }
  ],
  "diagnosis": "Final diagnosis or impression (TEXT field, in English)",
  "prescription": [
    {
      "medication": "medication name (in English)",
      "dosage": "dosage amount (in English)",
      "frequency": "how often (in English)",
      "duration": "how long (in English)",
      "instructions": "special instructions (in English)"
    }
  ],
  "lab_tests": [
    {
      "test_name": "name of test (in English)",
      "reason": "reason for test (in English)"
    }
  ],
  "vital_signs": {
    "blood_pressure": "BP reading or null",
    "heart_rate": "HR reading or null",
    "temperature": "temp reading or null",
    "weight": "weight or null",
    "height": "height or null"
  },
  "examination_findings": "Physical examination findings and observations (TEXT field, in English)",
  "follow_up_date": "suggested follow-up date in YYYY-MM-DD format or null",
  "follow_up_notes": "follow-up instructions and notes (TEXT field, in English)"
}

Important: 
- Translate all Urdu text to English before extracting data
- All text fields must be in English
- symptoms, prescription, lab_tests, and vital_signs are JSONB fields - return as arrays/objects
- All text fields (chief_complaint, diagnosis, examination_findings, follow_up_notes) should be strings or null
- Extract only the information that is explicitly mentioned in the transcription
- Use null for missing data, not empty strings or empty arrays
- Preserve medical terminology and convert it to standard English medical terms`
        },
        {
          role: 'user',
          content: `Translate the following transcription to English (if it contains Urdu or other languages), then extract structured appointment data:\n\n${transcript}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const extractedData = JSON.parse(completion.choices[0].message.content || '{}')

    return NextResponse.json({ data: extractedData })

  } catch (error) {
    console.error('OpenAI extraction error:', error)
    return NextResponse.json(
      { error: 'Data extraction failed' },
      { status: 500 }
    )
  }
}

