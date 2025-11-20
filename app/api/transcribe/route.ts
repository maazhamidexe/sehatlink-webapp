import { NextRequest, NextResponse } from 'next/server'
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY

    if (!deepgramApiKey) {
      return NextResponse.json(
        { error: 'DEEPGRAM_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const deepgram = createClient(deepgramApiKey)

    // Get the audio data from the request
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe the audio
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        language: 'en',
        smart_format: true,
        punctuate: true,
        diarize: true,
      }
    )

    if (error) {
      console.error('Deepgram transcription error:', error)
      return NextResponse.json(
        { error: 'Transcription failed' },
        { status: 500 }
      )
    }

    const transcript = result?.results?.channels[0]?.alternatives[0]?.transcript || ''

    return NextResponse.json({ 
      transcript,
      words: result?.results?.channels[0]?.alternatives[0]?.words || []
    })

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

