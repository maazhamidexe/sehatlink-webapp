import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const openai = new OpenAI({ apiKey: openaiApiKey })

    // Get the audio data from the request
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if streaming is requested
    const streamParam = formData.get('stream')
    const shouldStream = streamParam === 'true' || streamParam === 'True' || streamParam === '1'

    // Convert File to a format OpenAI can use
    // OpenAI SDK accepts File, Blob, or File-like objects
    // In Node.js, we can use the File object directly if supported,
    // or convert to a format the SDK understands
    
    // Get the file data as a buffer
    const arrayBuffer = await audioFile.arrayBuffer()
    
    // Create a File object that OpenAI SDK can use
    // The SDK should handle this in Node.js environments
    const file = new File(
      [arrayBuffer], 
      audioFile.name || 'recording.webm', 
      { type: audioFile.type || 'audio/webm' }
    )
    
    console.log('Created file for transcription:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    if (shouldStream) {
      // Return streaming response
      console.log('Starting streaming transcription...')
      
      // Create a readable stream for the client
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          let fullTranscript = ''
          
          try {
            // Create the streaming transcription
            const stream = await openai.audio.transcriptions.create({
              model: 'gpt-4o-mini-transcribe',
              file: file,
              response_format: 'text',
              stream: true,
            })

            // Process the stream
            for await (const chunk of stream) {
              // OpenAI streaming transcription events
              // Based on OpenAI SDK, chunks should be TranscriptionStreamEvent objects
              const event = chunk as any
              
              // Debug logging
              console.log('Received chunk type:', typeof event)
              console.log('Chunk structure:', event)
              
              // Handle different possible event formats
              let delta = ''
              
              // OpenAI transcription streaming events structure:
              // With response_format: 'text', chunks should contain delta text
              // Check various possible structures
              if (typeof event === 'string') {
                // Direct string response (most likely)
                delta = event
              } else if (event?.text) {
                delta = event.text
              } else if (event?.transcript) {
                delta = event.transcript
              } else if (event?.delta) {
                delta = event.delta
              } else if (event?.event === 'transcript.text.delta') {
                delta = event.delta || event.text || ''
              } else if (event?.type === 'transcript.text.delta') {
                delta = event.delta || event.text || ''
              } else if (event?.data) {
                // Handle SSE format
                try {
                  const parsed = JSON.parse(event.data)
                  delta = parsed.delta || parsed.text || ''
                } catch {
                  delta = event.data
                }
              } else if (event && typeof event === 'object') {
                // Try to stringify and extract
                const eventStr = JSON.stringify(event)
                console.log('Unknown event format:', eventStr.substring(0, 200))
              }
              
              // If we have a delta, send it
              if (delta) {
                fullTranscript += delta
                
                console.log('Sending delta:', delta, 'Full transcript length:', fullTranscript.length)
                
                // Send delta event to client
                const data = JSON.stringify({
                  type: 'delta',
                  delta: delta,
                  transcript: fullTranscript
                }) + '\n'
                
                controller.enqueue(encoder.encode(data))
              }
              
              // Check for completion event
              if (event?.event === 'transcript.text.done' || event?.type === 'transcript.text.done' || event?.done) {
                console.log('Transcription done event received')
                // Send completion event
                const finalTranscript = fullTranscript || event.transcript || ''
                const data = JSON.stringify({
                  type: 'done',
                  transcript: finalTranscript
                }) + '\n'
                
                controller.enqueue(encoder.encode(data))
                controller.close()
                return
              }
            }
            
            console.log('Stream completed, final transcript length:', fullTranscript.length)
            
            // Ensure we close with final transcript if no done event
            if (fullTranscript) {
              const data = JSON.stringify({
                type: 'done',
                transcript: fullTranscript
              }) + '\n'
              
              controller.enqueue(encoder.encode(data))
            }
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            const errorData = JSON.stringify({
              type: 'error',
              error: errorMessage
            }) + '\n'
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        }
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Non-streaming transcription
      const transcription = await openai.audio.transcriptions.create({
        model: 'gpt-4o-mini-transcribe',
        file: file,
        response_format: 'text',
      })

      // Handle text response format
      const transcriptText = typeof transcription === 'string' 
        ? transcription 
        : (transcription as any).text || String(transcription)

      return new Response(
        JSON.stringify({ 
          transcript: transcriptText
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error: any) {
    console.error('Transcription API error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Transcription failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

