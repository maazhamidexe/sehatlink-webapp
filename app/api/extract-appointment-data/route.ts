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
          content: `You are a medical transcription assistant. Extract structured data from the appointment transcription.
Return a JSON object with the following structure:
{
  "chief_complaint": "Main reason for visit",
  "symptoms": [
    {
      "name": "symptom name",
      "severity": "mild/moderate/severe",
      "duration": "duration description",
      "notes": "additional notes"
    }
  ],
  "diagnosis": "Final diagnosis or impression",
  "prescription": [
    {
      "medication": "medication name",
      "dosage": "dosage amount",
      "frequency": "how often",
      "duration": "how long",
      "instructions": "special instructions"
    }
  ],
  "lab_tests": [
    {
      "test_name": "name of test",
      "reason": "reason for test"
    }
  ],
  "vital_signs": {
    "blood_pressure": "BP reading",
    "heart_rate": "HR reading",
    "temperature": "temp reading",
    "weight": "weight",
    "height": "height"
  },
  "examination_findings": "Physical examination findings and observations",
  "follow_up_date": "suggested follow-up date in YYYY-MM-DD format or null",
  "follow_up_notes": "follow-up instructions and notes"
}

Extract only the information that is explicitly mentioned. Use null for missing data.`
        },
        {
          role: 'user',
          content: `Extract structured appointment data from this transcription:\n\n${transcript}`
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

