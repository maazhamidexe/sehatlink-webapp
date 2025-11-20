"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Mic,
  MicOff,
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
import { Separator } from "@/components/ui/separator"
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      // Simulate interim transcripts (in production, use Deepgram's live transcription)
      simulateInterimTranscripts()

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  const simulateInterimTranscripts = () => {
    // Simulate real-time transcription updates
    const samplePhrases = [
      "Patient presents with...",
      "Chief complaint is chest pain...",
      "Symptoms started two days ago...",
      "Blood pressure is 120/80...",
      "Prescribed medication..."
    ]
    
    let index = 0
    const interval = setInterval(() => {
      if (index < samplePhrases.length && isRecording) {
        setInterimTranscript(samplePhrases[index])
        index++
      }
    }, 3000)

    return () => clearInterval(interval)
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      setError(null)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const result = await response.json()
      const fullTranscript = transcript + " " + result.transcript
      setTranscript(fullTranscript)
      setInterimTranscript("")

      // Extract structured data from transcript
      await extractAppointmentData(fullTranscript)

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
                    <div className="space-y-4 text-sm">
                      {transcript && (
                        <p className="leading-relaxed text-card-foreground whitespace-pre-wrap">
                          {transcript}
                        </p>
                      )}
                      {interimTranscript && (
                        <p className="leading-relaxed text-muted-foreground italic">
                          {interimTranscript}
                        </p>
                      )}
                      {!transcript && !interimTranscript && (
                        <p className="text-center text-muted-foreground">
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
