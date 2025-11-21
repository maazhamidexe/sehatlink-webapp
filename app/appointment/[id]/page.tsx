"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Mic,
  Play,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"

interface AppointmentData {
  id: string
  patient_name: string
  patient_email: string
  appointment_date: string
  appointment_time: string
  status: string
  reason?: string
  notes?: string
}

export default function AppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string

  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null)
  const [loadingAppointment, setLoadingAppointment] = useState(true)
  const [appointmentStarted, setAppointmentStarted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const transcriptionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const activeTranscriptionRef = useRef<Promise<void> | null>(null)
  const accumulatedChunksRef = useRef<Blob[]>([]) // For accumulating audio chunks
  const isRecordingRef = useRef<boolean>(false) // Ref for recording state in intervals

  // Fetch appointment data from Supabase
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoadingAppointment(true)
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("id", appointmentId)
          .single()

        if (error) throw error

        setAppointmentData(data)
      } catch (err) {
        console.error("Error fetching appointment:", err)
        setError("Failed to load appointment data.")
      } finally {
        setLoadingAppointment(false)
      }
    }

    fetchAppointment()
  }, [appointmentId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startAppointment = async () => {
    try {
      setError(null)
      
      // Call API to update appointment status
      const response = await fetch('/api/start-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      })

      if (!response.ok) {
        throw new Error('Failed to start appointment')
      }

      setAppointmentStarted(true)
    } catch (err) {
      console.error('Error starting appointment:', err)
      setError('Failed to start appointment. Please try again.')
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      setTranscript("") // Clear previous transcript
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      accumulatedChunksRef.current = []

      // Handle audio chunks for real-time transcription
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          accumulatedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Clear transcription interval
        if (transcriptionIntervalRef.current) {
          clearInterval(transcriptionIntervalRef.current)
          transcriptionIntervalRef.current = null
        }
        
        // Wait for any pending transcription
        if (activeTranscriptionRef.current) {
          await activeTranscriptionRef.current
        }
        
        // Final transcription of complete audio to ensure accuracy
        const finalBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (finalBlob.size > 0) {
          console.log('Performing final transcription of complete audio')
          await transcribeAudioChunk(finalBlob)
        }
        
        console.log('Recording stopped, final transcript length:', transcript.length)
      }

      // Start recording with 3 second chunks for real-time transcription
      // This will trigger ondataavailable every 3 seconds
      mediaRecorder.start(3000)
      setIsRecording(true)
      isRecordingRef.current = true
      
      console.log('Recording started with real-time transcription')
      
      // Set up periodic transcription while recording
      // Transcribe accumulated audio every 3 seconds
      transcriptionIntervalRef.current = setInterval(() => {
        if (isRecordingRef.current && accumulatedChunksRef.current.length > 0 && !activeTranscriptionRef.current) {
          // Create a blob from accumulated chunks
          const accumulatedBlob = new Blob(accumulatedChunksRef.current, { type: 'audio/webm' })
          
          // Only transcribe if blob is large enough (at least 1KB)
          if (accumulatedBlob.size > 1024) {
            activeTranscriptionRef.current = transcribeAudioChunk(accumulatedBlob)
              .finally(() => {
                activeTranscriptionRef.current = null
              })
          }
        }
      }, 3000) // Transcribe every 3 seconds

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the interval first
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current)
        transcriptionIntervalRef.current = null
      }
      
      isRecordingRef.current = false
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      // Wait for any pending transcription chunks
      if (activeTranscriptionRef.current) {
        await activeTranscriptionRef.current
      }
      
      // Extract structured data from the accumulated transcript
      if (transcript.trim()) {
        setIsProcessing(true)
        await extractAppointmentData(transcript)
        setIsProcessing(false)
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  // Removed simulateInterimTranscripts - now using real streaming transcription

  // Transcribe accumulated audio chunks (for real-time transcription during recording)
  const transcribeAudioChunk = async (audioChunk: Blob) => {
    try {
      console.log('Transcribing accumulated chunk, size:', audioChunk.size)
      
      if (audioChunk.size === 0) {
        return
      }

      // Only transcribe new audio (skip already transcribed portion)
      // We'll use the accumulated blob which includes all audio so far
      const formData = new FormData()
      formData.append('audio', audioChunk, 'chunk.webm')
      formData.append('stream', 'true')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        console.error('Chunk transcription failed:', response.status)
        return
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        return
      }

      let buffer = ''
      let fullChunkTranscript = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          
          try {
            const data = JSON.parse(line)
            
            if (data.type === 'delta') {
              fullChunkTranscript += data.delta
            } else if (data.type === 'done') {
              fullChunkTranscript = data.transcript || fullChunkTranscript
            }
          } catch (parseError) {
            // Ignore parsing errors
          }
        }
      }

      // Process final buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim())
          if (data.type === 'done' && data.transcript) {
            fullChunkTranscript = data.transcript
          }
        } catch (e) {
          // Ignore
        }
      }

      // Update transcript with full accumulated transcript
      // Since we're transcribing accumulated audio, the result is the full transcript
      // We replace the transcript each time to get the most complete version
      if (fullChunkTranscript) {
        setTranscript(fullChunkTranscript)
        console.log('Updated transcript length:', fullChunkTranscript.length)
      }

    } catch (err) {
      console.error('Error transcribing chunk:', err)
      // Don't show error to user for chunk transcription failures
    }
  }

  // Transcribe complete audio (for final transcription after recording stops)
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      setError(null)
      setInterimTranscript("")
      let accumulatedTranscript = transcript ? transcript + " " : ""

      console.log('Starting transcription, audio size:', audioBlob.size)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('stream', 'true') // Enable streaming

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      console.log('Transcription response status:', response.status, 'Content-Type:', response.headers.get('content-type'))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Transcription failed:', errorText)
        throw new Error('Transcription failed: ' + errorText)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      console.log('Reading stream...')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          console.log('Stream reading done')
          break
        }

        // Decode chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true })
        console.log('Received chunk:', chunk.substring(0, 100))
        buffer += chunk
        
        // Process complete lines from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          
          try {
            const data = JSON.parse(trimmedLine)
            console.log('Parsed data:', data.type, data.delta ? `delta length: ${data.delta.length}` : '')
            
            if (data.type === 'delta') {
              // Update live transcription
              accumulatedTranscript += data.delta
              console.log('Updating transcript, current length:', accumulatedTranscript.length)
              setTranscript(accumulatedTranscript)
              setInterimTranscript("")
            } else if (data.type === 'done') {
              // Transcription complete
              const fullTranscript = data.transcript || accumulatedTranscript
              console.log('Transcription done, final length:', fullTranscript.length)
              setTranscript(fullTranscript)
              setInterimTranscript("")
              
              // Extract structured data from complete transcript
              await extractAppointmentData(fullTranscript)
              setIsProcessing(false)
              return
            } else if (data.type === 'error') {
              console.error('Transcription error from server:', data.error)
              throw new Error(data.error || 'Transcription error')
            }
          } catch (parseError) {
            // If parsing fails, it might be a partial JSON - log but don't break
            console.warn('Error parsing stream data:', parseError, 'Line:', trimmedLine.substring(0, 100))
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer.trim())
          console.log('Processing final buffer:', data.type)
          if (data.type === 'done') {
            const fullTranscript = data.transcript || accumulatedTranscript
            setTranscript(fullTranscript)
            await extractAppointmentData(fullTranscript)
            setIsProcessing(false)
            return
          }
        } catch (e) {
          console.warn('Error parsing final buffer:', e)
        }
      }

      // If we exit the loop without a done event, use accumulated transcript
      if (accumulatedTranscript.trim()) {
        console.log('Finalizing transcript from accumulated text')
        // Don't extract data here if we already have real-time transcript
        // We'll extract after recording stops if needed
      } else {
        console.warn('No transcript accumulated from final transcription')
      }
      setIsProcessing(false)

    } catch (err) {
      console.error('Transcription error:', err)
      setError('Failed to transcribe audio. Please try again.')
      setIsProcessing(false)
    }
  }

  const extractAppointmentData = async (fullTranscript: string) => {
    try {
      const response = await fetch('/api/extract-appointment-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript })
      })

      if (!response.ok) {
        throw new Error('Data extraction failed')
      }

      const result = await response.json()
      
      // Save to Supabase
      await saveAppointmentData(fullTranscript, result.data)

    } catch (err) {
      console.error('Extraction error:', err)
      setError('Failed to extract appointment data.')
      setIsProcessing(false)
    }
  }

  const saveAppointmentData = async (fullTranscript: string, extractedData: any) => {
    try {
      setIsSaving(true)

      const response = await fetch('/api/save-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          transcription: fullTranscript,
          ...extractedData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save appointment data')
      }

      setSaveSuccess(true)
      setIsProcessing(false)
      setIsSaving(false)

    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save appointment data.')
      setIsProcessing(false)
      setIsSaving(false)
    }
  }

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  const formatTime = (timeString: string) => {
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":")
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? "PM" : "AM"
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    }
    return timeString
  }

  if (loadingAppointment) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading appointment...</p>
        </div>
      </div>
    )
  }

  if (!appointmentData) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Appointment Not Found</h2>
            <p className="text-muted-foreground mb-4">
              Unable to load appointment data.
            </p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header with Logo and Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
            <h1 className="text-xl font-bold">Sehat Link</h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </motion.div>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2 text-2xl text-card-foreground">
                    Appointment Session
                  </CardTitle>
                  <CardDescription className="flex flex-col gap-2 text-base">
                    <span className="font-semibold">Patient: {appointmentData.patient_name}</span>
                    <span className="text-sm text-muted-foreground">{appointmentData.patient_email}</span>
                    <span>{formatDate(appointmentData.appointment_date)} at {formatTime(appointmentData.appointment_time)}</span>
                    {appointmentData.reason && (
                      <span className="text-sm">Reason: {appointmentData.reason}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {appointmentStarted && (
                    <Badge 
                      className={
                        saveSuccess 
                          ? "bg-green-500 text-white" 
                          : isRecording 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-primary text-primary-foreground"
                      }
                    >
                      {saveSuccess ? "Completed" : isRecording ? "Recording" : "In Progress"}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {!appointmentStarted ? (
            // Start Screen
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-center py-20"
            >
              <Card className="w-full max-w-md border-border bg-card shadow-lg">
                <CardContent className="flex flex-col items-center gap-6 p-8">
                  <div className="rounded-full bg-primary/10 p-6">
                    <Play className="h-12 w-12 text-primary" />
                  </div>
                  <div className="text-center">
                    <h2 className="mb-2 text-2xl font-semibold text-card-foreground">
                      Ready to Start?
                    </h2>
                    <p className="text-muted-foreground">
                      Click the button below to begin the appointment session and start recording the consultation.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={startAppointment}
                    disabled={!appointmentData}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Start Appointment
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            // Recording Screen
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Controls */}
              <Card className="border-border bg-card shadow-sm">
                <CardContent className="flex items-center justify-center gap-4 p-6">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={handleRecordingToggle}
                    disabled={isProcessing || isSaving || saveSuccess}
                    className="flex items-center gap-2"
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-5 w-5" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5" />
                        Start Recording
                      </>
                    )}
                  </Button>

                  {(isProcessing || isSaving) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{isSaving ? "Saving..." : "Processing..."}</span>
                    </div>
                  )}

                  {saveSuccess && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Appointment saved successfully!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-2 p-4 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>{error}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Transcription Display */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                    Live Transcription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full rounded-md border border-border bg-muted/50 p-4">
                    <div className="space-y-4">
                      {transcript && (
                        <p 
                          className="leading-relaxed text-card-foreground whitespace-pre-wrap"
                          style={{
                            fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Al Qalam', 'Jameel Noori Nastaleeq', 'Segoe UI', 'Tahoma', 'Arial', sans-serif",
                            fontSize: '1.375rem',
                            lineHeight: '2',
                            fontWeight: '400',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {transcript}
                        </p>
                      )}
                      {interimTranscript && (
                        <p 
                          className="leading-relaxed text-muted-foreground italic"
                          style={{
                            fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Al Qalam', 'Jameel Noori Nastaleeq', 'Segoe UI', 'Tahoma', 'Arial', sans-serif",
                            fontSize: '1.375rem',
                            lineHeight: '2',
                            fontWeight: '400',
                            letterSpacing: '0.01em'
                          }}
                        >
                          {interimTranscript}
                        </p>
                      )}
                      {!transcript && !interimTranscript && (
                        <p className="text-center text-muted-foreground text-lg">
                          Start recording to see transcription...
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card className="border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-card-foreground">Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      <span>Click "Start Recording" to begin capturing the appointment conversation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      <span>Speak clearly and ensure minimal background noise for best results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      <span>Click "Stop Recording" when the appointment is complete</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 text-primary">•</span>
                      <span>The system will automatically extract and save structured appointment data</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
