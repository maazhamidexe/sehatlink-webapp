'use client';

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import axios from "axios"
import { gsap } from "gsap"
import {
  Mic,
  Paperclip,
  Send,
  Activity,
  LogOut,
  MessageSquarePlus,
  Stethoscope,
  Heart,
  Pill,
  Brain,
  UserCheck,
  Sparkles,
  ClipboardList,
  Bell,
  Loader2,
  AlertCircle,
  Calendar,
  X,
  FileText,
  Languages,
  WifiOff,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Separator } from "@/components/ui/separator"
import { MedicineReminderCard } from "@/components/medicine-reminder-card"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant" | "system"
  timestamp: Date
  agent?: string
  isStreaming?: boolean
  isBridging?: boolean
  chat_trigger?: boolean
}

interface AgentInfo {
  name: string
  subtitle?: string
  icon: React.ReactNode
  color: string
  description: string
  lastActive: Date | null
}

interface Appointment {
  id: number
  doctor_id: number
  patient_id: number
  appointment_date: string | null
  appointment_time: string | null
  status: string | null
  chief_complaint: string | null
  diagnosis: string | null
  transcription: string | null
  symptoms: any
  prescription: any
  lab_tests: any
  vital_signs: any
  examination_findings: string | null
  follow_up_date: string | null
  follow_up_notes: string | null
  completed_at: string | null
  doctors?: {
    id: number
    name: string
    specialization: string | null
  }
}

// Agent mapping with icons and colors
const getAgentInfo = (agentName: string): AgentInfo => {
  const agentMap: Record<string, AgentInfo> = {
    "Triage Agent": {
      name: "Miss Sehat",
      subtitle: "Triage Agent",
      icon: <ClipboardList className="h-6 w-6" />,
      color: "#79fff7",
      description: "Assessing your needs and routing to the appropriate specialist",
      lastActive: null,
    },
    "Symptom Agent": {
      name: "Nora",
      subtitle: "Symptom Agent",
      icon: <Stethoscope className="h-6 w-6" />,
      color: "#ff776f",
      description: "Analyzing symptoms and providing preliminary insights",
      lastActive: null,
    },
    "Programme Eligibility Agent": {
      name: "Iris",
      subtitle: "Programme Eligibility Agent",
      icon: <UserCheck className="h-6 w-6" />,
      color: "#7adb78",
      description: "Checking programme eligibility and requirements",
      lastActive: null,
    },
    "Doctor Agent": {
      name: "Morgan",
      subtitle: "Doctor Agent",
      icon: <Heart className="h-6 w-6" />,
      color: "#ac6aff",
      description: "Coordinating with healthcare providers and doctors",
      lastActive: null,
    },
  }

  return (
    agentMap[agentName] || {
      name: agentName,
      icon: <Sparkles className="h-6 w-6" />,
      color: "#9f53ff",
      description: "Processing your request",
      lastActive: null,
    }
  )
}

const getSafeAgentName = (agentData: unknown): string => {
  if (typeof agentData === "string") {
    const trimmed = agentData.trim().toLowerCase()
    // Normalize agent names
    if (trimmed === "triage_agent" || trimmed === "triage agent") {
      return "Triage Agent"
    }
    if (trimmed === "symptom_agent" || trimmed === "symptom agent") {
      return "Symptom Agent"
    }
    if (trimmed === "programme_eligibility_agent" || trimmed === "programme eligibility agent") {
      return "Programme Eligibility Agent"
    }
    if (trimmed === "doctor_agent" || trimmed === "doctor agent") {
      return "Doctor Agent"
    }
    if (trimmed && trimmed !== "null" && trimmed !== "undefined") {
      // Capitalize first letter of each word for consistency
      return trimmed
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    }
  }

  if (agentData && typeof agentData === "object") {
    const possibleName =
      (agentData as { name?: string; agent?: string }).name ??
      (agentData as { name?: string; agent?: string }).agent

    if (typeof possibleName === "string") {
      const trimmed = possibleName.trim().toLowerCase()
      // Normalize agent names
      if (trimmed === "triage_agent" || trimmed === "triage agent") {
        return "Triage Agent"
      }
      if (trimmed === "symptom_agent" || trimmed === "symptom agent") {
        return "Symptom Agent"
      }
      if (trimmed === "programme_eligibility_agent" || trimmed === "programme eligibility agent") {
        return "Programme Eligibility Agent"
      }
      if (trimmed === "doctor_agent" || trimmed === "doctor agent") {
        return "Doctor Agent"
      }
      if (trimmed && trimmed !== "null" && trimmed !== "undefined") {
        // Capitalize first letter of each word for consistency
        return trimmed
          .split(" ")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
      }
    }
  }

  // Default to Triage Agent if agent is null, undefined, or invalid
  return "Triage Agent"
}

const getSafeResponseText = (response: unknown): string => {
  if (typeof response === "string") {
    return response
  }

  if (Array.isArray(response)) {
    return response.map((item) => getSafeResponseText(item)).join(" ")
  }

  if (response === null || typeof response === "undefined") {
    return ""
  }

  if (typeof response === "object") {
    if ("text" in (response as { text?: unknown }) && typeof (response as { text?: unknown }).text === "string") {
      return (response as { text: string }).text
    }
    try {
      return JSON.stringify(response)
    } catch {
      return ""
    }
  }

  return String(response)
}

// Translation object
const translations = {
  en: {
    // Header
    sehatLink: "Sehat Link",
    followUps: "Follow Ups",
    newChat: "New Chat",
    logout: "Logout",
    // Welcome message
    welcomeMessage: "Hello! I'm your healthcare assistant. How can I help you today?",
    // Bridging messages
    thinking: "Thinking...",
    processing: "Processing request...",
    analyzing: "Analyzing context...",
    routing: "Routing to appropriate agent...",
    callingTools: "Calling necessary tools...",
    // Notifications
    medicineFollowUp: "Medicine Follow-up",
    latestInsights: "Latest adherence insights",
    fetchingNotifications: "Fetching notifications...",
    allCaughtUp: "You're all caught up. No new alerts.",
    // Appointments
    myAppointments: "My Appointments",
    noCompletedAppointments: "No completed appointments yet",
    completed: "Completed",
    // Input
    typeMessage: "Type your message...",
    // Agent Orchestration
    agentOrchestration: "Agent Orchestration",
    waitingForAgent: "Waiting for agent activation...",
    activeNow: "Active now",
    currentlyProcessing: "Currently processing",
    // Appointment button
    allowAgentCall: "Allow agent to call and book appointment",
    // New chat confirmation
    newChatConfirm: "Doing this will delete the session. Do you want to continue?",
    // Appointment modal
    appointmentDetails: "Appointment Details",
    doctorInformation: "Doctor Information",
    dateTime: "Date & Time",
    chiefComplaint: "Chief Complaint",
    symptoms: "Symptoms",
    severity: "Severity",
    duration: "Duration",
    diagnosis: "Diagnosis",
    examinationFindings: "Examination Findings",
    vitalSigns: "Vital Signs",
    bloodPressure: "Blood Pressure",
    heartRate: "Heart Rate",
    temperature: "Temperature",
    weight: "Weight",
    prescription: "Prescription",
    medication: "Medication",
    dosage: "Dosage",
    frequency: "Frequency",
    instructions: "Instructions",
    labTests: "Lab Tests",
    testName: "Test Name",
    reason: "Reason",
    followUp: "Follow-up",
    date: "Date",
    transcription: "Transcription",
    // Status messages
    processingStatus: "Processing...",
    voiceAgentCalled: "Voice Agent has called on your behalf",
    // Errors
    userIdNotFound: "User ID not found. Please try logging in again.",
    failedToInitiate: "Failed to initiate appointment call",
    failedToStartChat: "Failed to start chat session",
    failedToStartNewChat: "Failed to start new chat",
    needToBeLoggedIn: "You need to be logged in to view notifications.",
    unableToFetch: "Unable to fetch notifications.",
  },
  ur: {
    // Header
    sehatLink: "صحت لنک",
    followUps: "فالو اپس",
    newChat: "نیا چیٹ",
    logout: "لاگ آؤٹ",
    // Welcome message
    welcomeMessage: "ہیلو! میں آپ کا ہیلتھ کیئر اسسٹنٹ ہوں۔ میں آپ کی کس طرح مدد کر سکتا ہوں؟",
    // Bridging messages
    thinking: "سوچ رہا ہوں...",
    processing: "درخواست پر کارروائی...",
    analyzing: "سیاق و سباق کا تجزیہ...",
    routing: "مناسب ایجنٹ کو بھیج رہا ہوں...",
    callingTools: "ضروری ٹولز استعمال کر رہا ہوں...",
    // Notifications
    medicineFollowUp: "دوائی فالو اپ",
    latestInsights: "تازہ ترین معلومات",
    fetchingNotifications: "اطلاعات حاصل کی جا رہی ہیں...",
    allCaughtUp: "آپ کوئی نئی الرٹ نہیں ہیں۔",
    // Appointments
    myAppointments: "میرے اپائنٹمنٹس",
    noCompletedAppointments: "ابھی تک کوئی مکمل اپائنٹمنٹ نہیں",
    completed: "مکمل",
    // Input
    typeMessage: "اپنا پیغام ٹائپ کریں...",
    // Agent Orchestration (keeping in English as requested)
    agentOrchestration: "Agent Orchestration",
    waitingForAgent: "Waiting for agent activation...",
    activeNow: "Active now",
    currentlyProcessing: "Currently processing",
    // Appointment button
    allowAgentCall: "ایجنٹ کو کال کرنے اور اپائنٹمنٹ بک کرنے کی اجازت دیں",
    // New chat confirmation
    newChatConfirm: "ایسا کرنے سے سیشن حذف ہو جائے گا۔ کیا آپ جاری رکھنا چاہتے ہیں؟",
    // Appointment modal
    appointmentDetails: "اپائنٹمنٹ کی تفصیلات",
    doctorInformation: "ڈاکٹر کی معلومات",
    dateTime: "تاریخ اور وقت",
    chiefComplaint: "بنیادی شکایت",
    symptoms: "علامات",
    severity: "شدت",
    duration: "دورانیہ",
    diagnosis: "تشخیص",
    examinationFindings: "معائنے کے نتائج",
    vitalSigns: "اہم علامات",
    bloodPressure: "بلڈ پریشر",
    heartRate: "دل کی دھڑکن",
    temperature: "درجہ حرارت",
    weight: "وزن",
    prescription: "نسخہ",
    medication: "دوائی",
    dosage: "خوری",
    frequency: "تعدد",
    instructions: "ہدایات",
    labTests: "لیب ٹیسٹ",
    testName: "ٹیسٹ کا نام",
    reason: "وجہ",
    followUp: "فالو اپ",
    date: "تاریخ",
    transcription: "ٹرانسکرپشن",
    // Status messages
    processingStatus: "پراسیسنگ...",
    voiceAgentCalled: "وائس ایجنٹ نے آپ کی جانب سے کال کی ہے",
    // Errors
    userIdNotFound: "صارف ID نہیں ملا۔ براہ کرم دوبارہ لاگ ان کریں۔",
    failedToInitiate: "اپائنٹمنٹ کال شروع کرنے میں ناکام",
    failedToStartChat: "چیٹ سیشن شروع کرنے میں ناکام",
    failedToStartNewChat: "نیا چیٹ شروع کرنے میں ناکام",
    needToBeLoggedIn: "اطلاعات دیکھنے کے لیے آپ کو لاگ ان ہونا ہوگا۔",
    unableToFetch: "اطلاعات حاصل کرنے میں ناکام۔",
  },
}

const normalizeMedicineStatusResponse = (response: unknown): string[] => {
  if (!response) return []

  if (typeof response === "string") {
    return response.trim() ? [response.trim()] : []
  }

  if (Array.isArray(response)) {
    return response
      .map((item) => {
        if (typeof item === "string") return item.trim()
        if (item && typeof item === "object" && "message" in item && typeof (item as { message?: string }).message === "string") {
          return (item as { message?: string }).message!.trim()
        }
        try {
          return JSON.stringify(item)
        } catch {
          return ""
        }
      })
      .filter((item): item is string => Boolean(item && item.length > 0))
  }

  if (typeof response === "object") {
    const hasNotificationTextField = 
      "notification_text" in (response as Record<string, unknown>) && 
      typeof (response as { notification_text?: unknown }).notification_text === "string"
    
    const hasMessageField = 
      "message" in (response as Record<string, unknown>) && 
      typeof (response as { message?: unknown }).message === "string"

    // Check for notification_text field first (primary field from backend)
    if (hasNotificationTextField) {
      const text = (response as { notification_text: string }).notification_text.trim()
      return text ? [text] : []
    }

    // Fallback to message field
    if (hasMessageField) {
      const text = (response as { message: string }).message.trim()
      return text ? [text] : []
    }

    try {
      const serialized = JSON.stringify(response)
      return serialized ? [serialized] : []
    } catch {
      return []
    }
  }

  return [String(response)]
}

export default function Home() {
  const router = useRouter()
  const { token, userId, loggedIn, loading, logout, setSessionData } = useAuth()
  const [language, setLanguage] = useState<"en" | "ur">("en")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [currentAgent, setCurrentAgent] = useState<string>("Triage Agent")
  const [activeAgents, setActiveAgents] = useState<Map<string, AgentInfo>>(new Map())
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [bridgingText, setBridgingText] = useState<string | null>(null)
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notificationMessages, setNotificationMessages] = useState<string[]>([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [localTrigger, setLocalTrigger] = useState(true)
  const [appointmentCallStatus, setAppointmentCallStatus] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [appointmentsLoading, setAppointmentsLoading] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  
  const t = translations[language]
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const agentPanelRef = useRef<HTMLDivElement>(null)
  const agentIconRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const bridgingTextRef = useRef<HTMLDivElement>(null)
  const bridgingIntervalRef = useRef<(() => void) | null>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Initialize Triage Agent on mount
  useEffect(() => {
    const triageInfo = getAgentInfo("Triage Agent")
    setActiveAgents(new Map([["Triage Agent", { ...triageInfo, lastActive: new Date() }]]))
  }, [])

  // Fetch patient appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) return

      setAppointmentsLoading(true)
      try {
        const response = await axios.get(`/api/patient/appointments?patient_id=${userId}`)
        setAppointments(response.data || [])
      } catch (error: any) {
        console.error("Error fetching appointments:", error)
      } finally {
        setAppointmentsLoading(false)
      }
    }

    if (userId && loggedIn) {
      fetchAppointments()
    }
  }, [userId, loggedIn])

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    })
  }

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !loggedIn) {
      router.push("/auth")
    }
  }, [loading, loggedIn, router])

  useEffect(() => {
    if (!isNotificationsOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isNotificationsOpen])

  // Function to start chat session and connect WebSocket
  const startChat = async () => {
    if (!token || !loggedIn) return

    // Close existing WebSocket if open
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close()
    }

    try {
      // Start chat session - use Next.js API proxy route to avoid SSL certificate issues
      const res = await axios.get("/api/proxy/chat-start", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log("Full backend response:", res.data)
      
      // Try different possible field names for session_id
      const newSessionId = res.data.session_id || res.data.sessionId || res.data.id || res.data.session?.id
      const newUserId = res.data.user_id || res.data.userId || res.data.user?.id
      
      setSessionData(newSessionId, newUserId)
      
      console.log("FROM FRONTEND\nSession:", newSessionId, "User ID:", newUserId)

      // Open WebSocket connection - use ws:// for HTTP, wss:// for HTTPS
      // For localhost HTTP, use ws:// instead of wss://
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.startsWith('https') 
        ? `wss://127.0.0.1:8000/ws/chat` 
        : `ws://127.0.0.1:8000/ws/chat`
      
      console.log("Connecting to WebSocket:", wsUrl)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket connected")
        // Add welcome message from Triage Agent
        setMessages([{
          id: "1",
          text: t.welcomeMessage,
          sender: "assistant",
          agent: "Triage Agent",
          timestamp: new Date(),
        }])
      }

      ws.onmessage = (e) => {
        console.log("📨 RAW WebSocket data:", e.data)
        const data = JSON.parse(e.data)
        console.log("📩 PARSED WebSocket data:", data)
        console.log("🔍 Trigger fields inspection:", {
          chat_trigger: {
            raw_value: data.chat_trigger,
            type: typeof data.chat_trigger,
            is_true: data.chat_trigger === true,
          },
          call_trigger: {
            raw_value: data.call_trigger,
            type: typeof data.call_trigger,
            is_true: data.call_trigger === true,
          }
        })
        
        const agentName = getSafeAgentName(data.agent)
        const responseText = getSafeResponseText(data.response)
        // Check both chat_trigger and call_trigger since backend might use either
        const chatTrigger = data.chat_trigger || data.call_trigger || false
        
        console.log("📩 WebSocket Message Processed:", {
          chat_trigger_from_backend: data.chat_trigger,
          call_trigger_from_backend: data.call_trigger,
          final_chatTrigger_value: chatTrigger,
          all_keys: Object.keys(data),
          full_data: data,
          raw_agent: data.agent,
          normalized_agent: agentName
        })
        
        // Update current agent only if it's different
        // getSafeAgentName already handles null/triage_agent -> "Triage Agent" conversion
        if (agentName !== currentAgent) {
          setCurrentAgent(agentName)
          
          // Add to active agents if not already present
          setActiveAgents((prev) => {
            const newMap = new Map(prev)
            if (!newMap.has(agentName)) {
              newMap.set(agentName, {
                ...getAgentInfo(agentName),
                lastActive: new Date(),
              })
            } else {
              const existing = newMap.get(agentName)!
              newMap.set(agentName, {
                ...existing,
                lastActive: new Date(),
              })
            }
            return newMap
          })
          
          // Animate agent change
          animateAgentChange(agentName)
        }
        
        // Clear bridging text when response arrives
        setWaitingForResponse(false)
        if (bridgingIntervalRef.current) {
          bridgingIntervalRef.current()
          bridgingIntervalRef.current = null
        }
        setBridgingText(null)
        
        // Create message with streaming
        const messageId = Date.now().toString()
        const newMessage: Message = {
          id: messageId,
          text: "", // Start empty for streaming
          agent: agentName,
          sender: "assistant",
          timestamp: new Date(),
          isStreaming: true,
          chat_trigger: chatTrigger,
        }
        
        setMessages((prev) => [...prev, newMessage])
        
        // Stream the text
        streamText(responseText, messageId)
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
      }

      setSocket(ws)
    } catch (err: any) {
      console.error("Failed to start chat session:", err)
      console.error("Full error response:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        code: err.code,
      })
      
      // Extract error message from various possible locations
      const errorMessage = 
        err.response?.data?.error || 
        err.response?.data?.detail || 
        err.response?.data?.message ||
        err.message || 
        t.failedToStartChat
      
      // Show detailed error in alert
      const statusCode = err.response?.status ? ` (Status: ${err.response.status})` : ''
      alert(`${t.failedToStartChat}${statusCode}: ${errorMessage}`)
    }
  }

  // Start chat session on mount
  useEffect(() => {
    if (!token || !loggedIn) return

    startChat()

    // Cleanup WebSocket on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loggedIn])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // GSAP animation for agent changes
  const animateAgentChange = (agentName: string) => {
    const agentIcon = agentIconRefs.current.get(agentName)
    if (!agentIcon) return

    // Create a timeline for smooth transitions
    const tl = gsap.timeline()

    // Pulse animation for the new active agent
    tl.to(agentIcon, {
      scale: 1.15,
      duration: 0.2,
      ease: "power2.out",
    })
      .to(agentIcon, {
        scale: 1,
        duration: 0.3,
        ease: "elastic.out(1, 0.5)",
      })

    // Animate all other agents to inactive state
    activeAgents.forEach((info, name) => {
      if (name !== agentName) {
        const icon = agentIconRefs.current.get(name)
        if (icon) {
          gsap.to(icon, {
            opacity: 0.4,
            scale: 0.95,
            duration: 0.4,
            ease: "power2.out",
          })
        }
      }
    })

    // Animate the new active agent to active state
    gsap.to(agentIcon, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
    })

    // Start continuous pulse animation for active agent
    startContinuousPulse(agentName)
  }

  // Continuous pulse animation for active agent
  const startContinuousPulse = (agentName: string) => {
    const agentIcon = agentIconRefs.current.get(agentName)
    if (!agentIcon) return

    // Kill any existing animations on this element
    gsap.killTweensOf(agentIcon)

    // Create a continuous pulse animation
    gsap.to(agentIcon, {
      scale: 1.05,
      duration: 1.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    })
  }

  // Stop pulse animation when agent becomes inactive
  const stopPulse = (agentName: string) => {
    const agentIcon = agentIconRefs.current.get(agentName)
    if (agentIcon) {
      gsap.killTweensOf(agentIcon)
      gsap.to(agentIcon, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      })
    }
  }

  // Animate agent icons when they're added
  useEffect(() => {
    activeAgents.forEach((info, agentName) => {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const icon = agentIconRefs.current.get(agentName)
        if (icon) {
          const isActive = agentName === currentAgent
          gsap.fromTo(
            icon,
            {
              opacity: 0,
              scale: 0,
              y: -20,
              rotation: -180,
            },
            {
              opacity: isActive ? 1 : 0.4,
              scale: isActive ? 1 : 0.95,
              y: 0,
              rotation: 0,
              duration: 0.6,
              ease: "back.out(1.7)",
              onComplete: () => {
                if (isActive) {
                  startContinuousPulse(agentName)
                }
              },
            }
          )
        }
      }, 100)
    })
  }, [activeAgents, currentAgent])

  // Handle current agent changes
  useEffect(() => {
    activeAgents.forEach((info, agentName) => {
      const icon = agentIconRefs.current.get(agentName)
      if (!icon) return

      const isActive = agentName === currentAgent
      if (isActive) {
        startContinuousPulse(agentName)
        gsap.to(icon, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
        })
      } else {
        stopPulse(agentName)
        gsap.to(icon, {
          opacity: 0.4,
          scale: 0.95,
          duration: 0.4,
          ease: "power2.out",
        })
      }
    })
  }, [currentAgent, activeAgents])

  // Add single bridging text that cycles through states
  const addBridgingMessages = () => {
    const bridgingMessages = [
      t.thinking,
      t.processing,
      t.analyzing,
      t.routing,
      t.callingTools,
    ]

    let currentIndex = 0
    setBridgingText(bridgingMessages[0])

    // Cycle through messages with slow, subtle transitions
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % bridgingMessages.length
      const newText = bridgingMessages[currentIndex]
      
      // Very subtle fade transition
      if (bridgingTextRef.current) {
        gsap.to(bridgingTextRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.inOut",
          onComplete: () => {
            setBridgingText(newText)
            gsap.to(bridgingTextRef.current, {
              opacity: 0.5,
              duration: 0.3,
              ease: "power1.inOut",
            })
          },
        })
      } else {
        setBridgingText(newText)
      }
    }, 2500) // Slower pace - 2.5 seconds between changes

    // Store interval to clear it later
    return () => clearInterval(interval)
  }

  // Animate bridging text on mount/update
  useEffect(() => {
    if (bridgingText && bridgingTextRef.current) {
      gsap.fromTo(
        bridgingTextRef.current,
        { opacity: 0 },
        { opacity: 0.5, duration: 0.4, ease: "power2.out" }
      )
    }
  }, [bridgingText])

  // Fast text streaming effect
  const streamText = (text: string, messageId: string, onComplete?: () => void) => {
    const chars = text.split("")
    let currentIndex = 0
    const streamSpeed = 5 // Fast streaming (lower = faster)

    const streamInterval = setInterval(() => {
      if (currentIndex < chars.length) {
        const currentText = chars.slice(0, currentIndex + 1).join("")
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, text: currentText, isStreaming: currentIndex < chars.length - 1 }
              : msg
          )
        )
        currentIndex++
      } else {
        clearInterval(streamInterval)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isStreaming: false } : msg
          )
        )
        if (onComplete) onComplete()
      }
    }, streamSpeed)
  }

  const handleSend = () => {
    if (!inputValue.trim() || !socket || socket.readyState !== WebSocket.OPEN || !userId) return

    const payload = { message: inputValue, user_id: userId }
    
    socket.send(JSON.stringify(payload))

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")

    // Start bridging messages and set waiting state
    setWaitingForResponse(true)
    if (bridgingIntervalRef.current) {
      bridgingIntervalRef.current()
    }
    bridgingIntervalRef.current = addBridgingMessages()
  }

  const handleNewChat = async () => {
    const confirmed = window.confirm(t.newChatConfirm)
    
    if (!confirmed) return

    try {
      // Close existing WebSocket connection
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }

      // Clear messages
      setMessages([])

      // Call backend new-chat endpoint
      if (token) {
        await axios.post("/api/proxy/new-chat", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }

      // Start a new chat session
      await startChat()
    } catch (error: any) {
      console.error("New chat error:", error)
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail || 
        error.message || 
        t.failedToStartNewChat
      alert(`${t.failedToStartNewChat}: ${errorMessage}`)
    }
  }

  const fetchMedicineStatusNotifications = async () => {
    if (!userId) {
      setNotificationError(t.needToBeLoggedIn)
      setNotificationMessages([])
      setNotificationLoading(false)
      return
    }

    setNotificationLoading(true)
    setNotificationError(null)

    try {
      const response = await axios.get(`/api/proxy/follow-up/medicine-status/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const parsedMessages = normalizeMedicineStatusResponse(response.data)
      setNotificationMessages(parsedMessages)
    } catch (error: any) {
      console.error("Medicine status notification error:", error)
      const message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        t.unableToFetch
      setNotificationError(message)
      setNotificationMessages([])
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleNotificationsClick = async () => {
    if (isNotificationsOpen) {
      setIsNotificationsOpen(false)
      return
    }

    setIsNotificationsOpen(true)
    setNotificationMessages([])
    setNotificationError(null)
    setNotificationLoading(true)
    await fetchMedicineStatusNotifications()
  }

  const handleInitiateAppointment = async () => {
    console.log("🚀 Initiating appointment call for user:", userId)
    
    if (!userId) {
      alert(t.userIdNotFound)
      return
    }

    try {
      console.log("⚙️ Setting localTrigger to false")
      setLocalTrigger(false) // Hide the button immediately
      setAppointmentCallStatus(t.processingStatus)
      
      // Call the initiate-appointment endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      await axios.post(
        `${apiUrl}/initiate-appointment/`,
        { user_id: parseInt(userId) },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      setAppointmentCallStatus(t.voiceAgentCalled)
      
      // Clear the success message after 5 seconds
      setTimeout(() => {
        setAppointmentCallStatus(null)
      }, 5000)
    } catch (error: any) {
      console.error("Appointment initiation error:", error)
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.detail || 
        error.message || 
        t.failedToInitiate
      alert(`${t.failedToInitiate}: ${errorMessage}`)
      setLocalTrigger(true) // Re-show the button if there's an error
      setAppointmentCallStatus(null)
    }
  }

  const handleDegradeMode = () => {
    const confirmed = window.confirm("This is an offline mode and all the features except chat will be turned off")
    if (confirmed) {
      router.push("/degradechat")
    }
  }

  const handleLogout = async () => {
    try {
      // Close WebSocket connection
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }

      // Call backend logout endpoint
      if (token) {
        await axios.post("/api/proxy/user/logout", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error: any) {
      console.error("Logout error:", error)
      // Continue with logout even if backend call fails
    } finally {
      // Log out user locally
      logout()
      router.push("/auth")
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-n-8 text-n-1 p-4 md:p-6 font-sora">
      {/* Futuristic background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-color-1/5 via-transparent to-color-5/5" />
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: "radial-gradient(circle at 20% 50%, rgba(121, 255, 247, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(172, 106, 255, 0.1) 0%, transparent 50%)",
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      <div className="relative mx-auto flex h-full max-h-full max-w-[1920px] flex-col gap-4 overflow-hidden lg:gap-6 z-10">
        {/* Header with New Chat and Logout */}
        <div className="flex items-center justify-between relative z-50">
          <div className="flex items-center gap-2">
            <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
            <h1 className={`text-xl font-bold text-n-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.sehatLink}</h1>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Button
              onClick={() => setLanguage(language === "en" ? "ur" : "en")}
              variant="outline"
              className={`flex items-center gap-2 border-color-1/50 bg-color-1/10 text-color-1 hover:bg-color-1/20 hover:text-color-1 backdrop-blur-sm shadow-lg shadow-color-1/20 ${language === "ur" ? "font-urdu" : ""}`}
              style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}
              title={language === "en" ? "اردو میں تبدیل کریں" : "Switch to English"}
            >
              <Languages className="h-4 w-4" />
              {language === "en" ? "اردو" : "English"}
            </Button>
            <div className="relative" ref={notificationsRef}>
              <Button
                onClick={handleNotificationsClick}
                variant="outline"
                className={`flex items-center gap-2 border-color-1/50 bg-color-1/10 text-color-1 hover:bg-color-1/20 hover:text-color-1 backdrop-blur-sm shadow-lg shadow-color-1/20 ${language === "ur" ? "font-urdu" : ""}`}
                style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}
              >
                <Bell className="h-4 w-4" />
                {t.followUps}
              </Button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-n-6 bg-n-8/95 backdrop-blur-xl shadow-2xl z-[100]">
                  <div className="border-b border-n-6/60 px-4 py-3">
                    <p className={`text-sm font-semibold text-n-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.medicineFollowUp}</p>
                    <p className={`text-xs text-n-4 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.latestInsights}</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3">
                    {notificationLoading && (
                      <div className={`flex items-center gap-2 text-n-3 text-sm ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.fetchingNotifications}
                      </div>
                    )}
                    {!notificationLoading && notificationError && (
                      <div className={`flex items-start gap-2 text-xs text-red-300 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>{notificationError}</span>
                      </div>
                    )}
                    {!notificationLoading && !notificationError && notificationMessages.length === 0 && (
                      <p className={`text-sm text-n-4 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.allCaughtUp}</p>
                    )}
                    {!notificationLoading &&
                      !notificationError &&
                      notificationMessages.map((message, index) => (
                        <div
                          key={`${message}-${index}`}
                          className="rounded-md border border-n-6/60 bg-n-9/60 p-3 text-sm text-n-1 shadow-sm"
                        >
                          {message}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleNewChat}
              variant="outline"
              className={`flex items-center gap-2 border-color-1/50 bg-color-1/10 text-color-1 hover:bg-color-1/20 hover:text-color-1 backdrop-blur-sm shadow-lg shadow-color-1/20 ${language === "ur" ? "font-urdu" : ""}`}
              style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}
            >
              <MessageSquarePlus className="h-4 w-4" />
              {t.newChat}
            </Button>
            <Button
              onClick={handleDegradeMode}
              variant="outline"
              className={`flex items-center gap-2 border-n-6/50 bg-n-7/30 text-n-3 hover:bg-n-7/50 hover:text-n-2 backdrop-blur-sm shadow-lg ${language === "ur" ? "font-urdu" : ""}`}
              style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}
            >
              <WifiOff className="h-4 w-4" />
              Degrade Mode
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className={`flex items-center gap-2 border-n-6 bg-n-7/50 text-n-1 hover:bg-n-7 hover:text-color-1 backdrop-blur-sm ${language === "ur" ? "font-urdu" : ""}`}
              style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}
            >
              <LogOut className="h-4 w-4" />
              {t.logout}
            </Button>
          </div>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 overflow-hidden md:grid-cols-12 lg:gap-6">
        {/* Left Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="col-span-1 flex h-full flex-col gap-4 overflow-y-auto md:col-span-3"
        >
          {/* Appointments List */}
          <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg flex items-center gap-2 text-n-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                <Calendar className="h-5 w-5" />
                {t.myAppointments}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-n-4" />
                </div>
              ) : appointments.length === 0 ? (
                <p className={`text-sm text-n-4 text-center py-4 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.noCompletedAppointments}</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {appointments.map((appointment) => (
                      <motion.div
                        key={appointment.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className="border-n-6 bg-n-8/50 cursor-pointer hover:bg-n-7/70 transition-colors"
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setIsAppointmentModalOpen(true)
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className={`text-sm font-semibold text-n-1 line-clamp-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                                    {appointment.doctors?.name || (language === "en" ? "Doctor" : "ڈاکٹر")}
                                  </p>
                                  {appointment.doctors?.specialization && (
                                    <p className={`text-xs text-n-4 mt-0.5 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                                      {appointment.doctors.specialization}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className={`bg-color-1/10 border-color-1/30 text-color-1 text-xs ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                                  {t.completed}
                                </Badge>
                              </div>
                              {appointment.appointment_date && (
                                <p className="text-xs text-n-3">
                                  {new Date(appointment.appointment_date).toLocaleDateString()}
                                  {appointment.appointment_time && ` • ${appointment.appointment_time}`}
                                </p>
                              )}
                              {appointment.chief_complaint && (
                                <p className={`text-xs text-n-4 line-clamp-2 mt-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>
                                  {appointment.chief_complaint}
                                </p>
                              )}
                              {appointment.diagnosis && !appointment.chief_complaint && (
                                <p className={`text-xs text-n-4 line-clamp-2 mt-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>
                                  {appointment.diagnosis}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Medicine Reminders */}
          <MedicineReminderCard />
        </motion.div>

        {/* Center Chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-1 flex h-full min-h-0 flex-col md:col-span-6"
        >
          <Card className="relative flex h-full max-h-full min-h-0 flex-col border-n-6 bg-n-7/50 backdrop-blur-sm shadow-lg overflow-hidden" style={{
            boxShadow: "0 0 40px rgba(121, 255, 247, 0.1), inset 0 0 40px rgba(121, 255, 247, 0.05)",
          }}>
            {/* Futuristic corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-color-1/30 pointer-events-none" />
            <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-color-1/30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-color-1/30 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-color-1/30 pointer-events-none" />
            <CardContent className="flex min-h-0 flex-1 flex-col p-0 overflow-hidden">
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="flex-1 w-full">
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message) => {
                          const isBridging = message.isBridging
                          const isStreaming = message.isStreaming
                          const agentInfo = message.agent ? getAgentInfo(message.agent) : null
                          
                          return (
                            <motion.div
                              key={message.id}
                              id={message.id}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: isBridging ? 0.5 : 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} ${isBridging ? "opacity-50" : ""}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 relative ${
                                  message.sender === "user"
                                    ? "bg-color-1 text-n-8"
                                    : isBridging
                                    ? "bg-n-9/20 backdrop-blur text-n-3 border border-n-6/50"
                                    : "bg-n-9/60 backdrop-blur text-n-1 border border-n-6 shadow-lg"
                                } ${isStreaming ? "border-l-2" : ""}`}
                                style={
                                  isStreaming && agentInfo
                                    ? {
                                        borderLeftColor: agentInfo?.color || "#ac6aff",
                                        boxShadow: `0 0 20px ${agentInfo?.color || "#ac6aff"}15, inset 0 0 20px ${agentInfo?.color || "#ac6aff"}05`,
                                      }
                                    : {}
                                }
                              >
                                {message.sender === "assistant" && message.agent && agentInfo && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <motion.div
                                      className="p-1.5 rounded-lg backdrop-blur-sm"
                                      style={{
                                        backgroundColor: agentInfo.color + "25",
                                        color: agentInfo.color,
                                      }}
                                      animate={{
                                        boxShadow: [
                                          `0 0 10px ${agentInfo.color}30`,
                                          `0 0 20px ${agentInfo.color}50`,
                                          `0 0 10px ${agentInfo.color}30`,
                                        ],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                    >
                                      {agentInfo.icon}
                                    </motion.div>
                                    <span
                                      className="text-xs font-semibold tracking-wide"
                                      style={{
                                        color: agentInfo.color,
                                        textShadow: `0 0 10px ${agentInfo.color}40`,
                                      }}
                                    >
                                      {agentInfo.name}
                                    </span>
                                  </div>
                                )}
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-start gap-2">
                                    <div className={`text-sm leading-relaxed font-medium flex-1 prose prose-invert prose-sm max-w-none whitespace-pre-wrap ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>
                                      <ReactMarkdown
                                        components={{
                                          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                          em: ({ children }) => <em className="italic">{children}</em>,
                                          code: ({ children, className }) => {
                                            const isInline = !className
                                            return isInline ? (
                                              <code className="bg-n-8/80 px-1.5 py-0.5 rounded text-xs font-mono">
                                                {children}
                                              </code>
                                            ) : (
                                              <code className="block bg-n-8/80 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto">
                                                {children}
                                              </code>
                                            )
                                          },
                                          pre: ({ children }) => (
                                            <pre className="bg-n-8/80 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto mb-2 last:mb-0">
                                              {children}
                                            </pre>
                                          ),
                                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                          li: ({ children }) => <li className="ml-4">{children}</li>,
                                          blockquote: ({ children }) => (
                                            <blockquote className="border-l-4 border-n-6 pl-4 italic mb-2">
                                              {children}
                                            </blockquote>
                                          ),
                                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                          h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                                          hr: () => <hr className="my-2 border-n-6" />,
                                        }}
                                      >
                                        {message.text}
                                      </ReactMarkdown>
                                      {isStreaming && (
                                        <motion.span
                                          className="inline-block w-0.5 h-4 ml-1 bg-color-1"
                                          animate={{ opacity: [1, 0, 1] }}
                                          transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                          }}
                                          style={{
                                            backgroundColor: agentInfo?.color || "#ac6aff",
                                            boxShadow: `0 0 8px ${agentInfo?.color || "#ac6aff"}80`,
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  {/* Show button only if chat_trigger and localTrigger are both true */}
                                  {(() => {
                                    const shouldShowButton = message.sender === "assistant" && message.chat_trigger && localTrigger && !isStreaming;
                                    
                                    console.log("🔘 Button Visibility Check:", {
                                      messageId: message.id,
                                      sender: message.sender,
                                      chat_trigger: message.chat_trigger,
                                      localTrigger: localTrigger,
                                      isStreaming: isStreaming,
                                      shouldShowButton: shouldShowButton,
                                      agent: message.agent
                                    });
                                    
                                    return shouldShowButton ? (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                      >
                                        <Button
                                          onClick={handleInitiateAppointment}
                                          className={`w-full bg-gradient-to-r from-color-1 to-color-2 text-n-8 hover:opacity-90 font-semibold text-sm py-2 shadow-lg ${language === "ur" ? "font-urdu" : ""}`}
                                          style={{
                                            boxShadow: `0 0 20px ${agentInfo?.color || "#ac6aff"}40`,
                                            fontFamily: language === "ur" ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" : undefined,
                                          }}
                                        >
                                          {t.allowAgentCall}
                                        </Button>
                                      </motion.div>
                                    ) : null;
                                  })()}
                                  {/* Show appointment call status message */}
                                  {message.sender === "assistant" && appointmentCallStatus && !isStreaming && (
                                    <motion.div
                                      initial={{ opacity: 0, y: -5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className={`flex items-center gap-2 text-sm text-color-1 font-medium ${language === "ur" ? "font-urdu" : ""}`}
                                      style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}
                                    >
                                      <svg 
                                        className="h-4 w-4" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round" 
                                          strokeWidth={2} 
                                          d="M5 13l4 4L19 7" 
                                        />
                                      </svg>
                                      {appointmentCallStatus}
                                    </motion.div>
                                  )}
                                </div>
                                {!isBridging && (
                                  <p className={`mt-2 text-xs ${message.sender === "user" ? "text-n-8/70" : "text-n-3"} ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                                {/* Futuristic glow effect for assistant messages */}
                                {message.sender === "assistant" && !isBridging && agentInfo && (
                                  <div
                                    className="absolute inset-0 rounded-lg -z-10 blur-xl opacity-20"
                                    style={{
                                      backgroundColor: agentInfo?.color || "#ac6aff",
                                    }}
                                  />
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                      {/* Single bridging text - no bubble, just text - only show when waiting for response */}
                      {waitingForResponse && bridgingText && (
                        <motion.div
                          ref={bridgingTextRef}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-start px-2 py-1"
                        >
                          <p className={`text-sm text-n-4 italic font-light ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                            {bridgingText}
                          </p>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </ScrollArea>
              </div>
              <Separator className="shrink-0 border-n-6" />
              <div className="relative flex shrink-0 items-center gap-2 p-4 bg-n-7/30 backdrop-blur-sm border-t border-n-6/50">
                {/* Futuristic scan line effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to bottom, transparent 0%, rgba(121, 255, 247, 0.05) 50%, transparent 100%)",
                    height: "2px",
                  }}
                  animate={{
                    y: [0, 200, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-n-2 hover:bg-n-9/40 hover:text-color-1 transition-all duration-300 hover:scale-110"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={t.typeMessage}
                    className={`w-full border-n-6 bg-n-9/60 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1 focus-visible:shadow-lg focus-visible:shadow-color-1/20 transition-all duration-300 ${language === "ur" ? "font-urdu" : ""}`}
                    style={{
                      fontFamily: language === "ur" ? "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" : undefined,
                      direction: language === "ur" ? "rtl" : "ltr",
                      boxShadow: inputValue ? "0 0 20px rgba(121, 255, 247, 0.1)" : "none",
                    }}
                  />
                  {inputValue && (
                    <motion.div
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <div className="w-2 h-2 rounded-full bg-color-1 animate-pulse" />
                    </motion.div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-n-2 hover:bg-n-9/40 hover:text-color-1 transition-all duration-300 hover:scale-110"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="bg-conic-gradient text-n-8 hover:opacity-90 font-code font-bold uppercase tracking-wider shadow-lg shadow-color-1/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    style={{
                      boxShadow: inputValue.trim() 
                        ? "0 0 30px rgba(121, 255, 247, 0.4), 0 0 60px rgba(121, 255, 247, 0.2)" 
                        : "none",
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar - Agent Visualization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="col-span-1 flex h-full flex-col md:col-span-3"
        >
          <Card className="flex h-full flex-col border-n-6 bg-n-7/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardHeader className="shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg text-n-1">
                <Activity className="h-5 w-5 text-n-2" />
                Agent Orchestration
              </CardTitle>
            </CardHeader>
            <CardContent ref={agentPanelRef} className="flex-1 overflow-y-auto">
              {activeAgents.size === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="rounded-full border-2 border-n-6 bg-n-9/40 p-6 mb-4">
                    <Sparkles className="h-8 w-8 text-n-4" />
                  </div>
                  <p className="text-sm text-n-4 text-center">
                    Waiting for agent activation...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4 py-4">
                    {Array.from(activeAgents.entries()).map(([agentName, agentInfo], index) => {
                      const isActive = agentName === currentAgent
                      return (
                        <div key={agentName} className="flex flex-col items-center gap-3 w-full">
                          <div
                            ref={(el) => {
                              if (el) agentIconRefs.current.set(agentName, el)
                            }}
                            className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              isActive
                                ? "border-color-1 shadow-lg shadow-color-1/30"
                                : "border-n-6 bg-n-9/40"
                            }`}
                            style={{
                              background: isActive
                                ? `linear-gradient(135deg, ${agentInfo.color}22, ${agentInfo.color}44)`
                                : undefined,
                            }}
                          >
                            {/* Active pulse effect */}
                            {isActive && (
                              <div
                                className="absolute inset-0 rounded-full animate-ping"
                                style={{
                                  backgroundColor: agentInfo.color,
                                  opacity: 0.2,
                                }}
                              />
                            )}
                            {/* Glow effect for active agent */}
                            {isActive && (
                              <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  boxShadow: `0 0 20px ${agentInfo.color}40, 0 0 40px ${agentInfo.color}20`,
                                }}
                              />
                            )}
                            <div
                              className="relative z-10"
                              style={{
                                color: isActive ? agentInfo.color : "#757185",
                              }}
                            >
                              {agentInfo.icon}
                            </div>
                            {/* Active indicator ring */}
                            {isActive && (
                              <motion.div
                                className="absolute inset-0 rounded-full border-2"
                                style={{
                                  borderColor: agentInfo.color,
                                }}
                                animate={{
                                  scale: [1, 1.15, 1],
                                  opacity: [0.5, 0.8, 0.5],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                            )}
                          </div>
                          {/* Agent name */}
                          <div className="text-center">
                            <p
                              className={`text-sm font-semibold transition-colors ${
                                isActive ? "text-n-1" : "text-n-4"
                              }`}
                              style={{
                                color: isActive ? agentInfo.color : undefined,
                              }}
                            >
                              {agentInfo.name}
                            </p>
                            {agentInfo.subtitle && (
                              <p className="text-xs text-n-4 mt-0.5">
                                {agentInfo.subtitle}
                              </p>
                            )}
                            {isActive && agentInfo.lastActive && (
                              <p className="text-xs text-n-4 mt-1">
                                Active now
                              </p>
                            )}
                          </div>
                          {/* Connection line */}
                          {index < Array.from(activeAgents.entries()).length - 1 && (
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                              className="h-6 w-0.5 bg-n-6"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <Separator className="my-4 border-n-6" />
                  {/* Current Agent Details */}
                  {currentAgent && activeAgents.has(currentAgent) && (
                    <motion.div
                      key={currentAgent}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="rounded-lg border border-n-6 bg-n-9/40 backdrop-blur p-4"
                      style={{
                        borderColor: activeAgents.get(currentAgent)?.color + "40",
                        boxShadow: `0 4px 12px ${activeAgents.get(currentAgent)?.color}15`,
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{
                            backgroundColor: activeAgents.get(currentAgent)?.color + "20",
                            color: activeAgents.get(currentAgent)?.color,
                          }}
                        >
                          {activeAgents.get(currentAgent)?.icon}
                        </div>
                        <div>
                          <h3
                            className="font-semibold text-n-1"
                            style={{
                              color: activeAgents.get(currentAgent)?.color,
                            }}
                          >
                            {activeAgents.get(currentAgent)?.name}
                          </h3>
                          {activeAgents.get(currentAgent)?.subtitle && (
                            <p className="text-xs text-n-4 mt-0.5">
                              {activeAgents.get(currentAgent)?.subtitle}
                            </p>
                          )}
                          <p className="text-xs text-n-4 mt-1">
                            Currently processing
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-n-2 leading-relaxed">
                        {activeAgents.get(currentAgent)?.description}
                      </p>
                    </motion.div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>

      {/* Appointment Details Modal */}
      <AnimatePresence>
        {isAppointmentModalOpen && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAppointmentModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-n-6 bg-n-8 shadow-2xl"
            >
              <Card className="border-0 bg-transparent">
                <CardHeader className="border-b border-n-6 bg-n-7/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className={`text-xl flex items-center gap-2 text-n-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                      <FileText className="h-5 w-5" />
                      {t.appointmentDetails}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAppointmentModalOpen(false)}
                      className="text-n-4 hover:text-n-1"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  <ScrollArea className="h-full">
                    <div className="space-y-6">
                      {/* Doctor Information */}
                      <div>
                        <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.doctorInformation}</h3>
                        <div className="space-y-1">
                          <p className={`text-base font-semibold text-n-1 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>
                            {selectedAppointment.doctors?.name || "N/A"}
                          </p>
                          {selectedAppointment.doctors?.specialization && (
                            <p className={`text-sm text-n-4 ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{selectedAppointment.doctors.specialization}</p>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-n-6" />

                      {/* Appointment Date & Time */}
                      <div>
                        <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.dateTime}</h3>
                        <div className="space-y-1">
                          {selectedAppointment.appointment_date && (
                            <p className="text-sm text-n-1">
                              {t.date}: {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          {selectedAppointment.appointment_time && (
                            <p className="text-sm text-n-1">{language === "en" ? "Time" : "وقت"}: {selectedAppointment.appointment_time}</p>
                          )}
                          {selectedAppointment.completed_at && (
                            <p className="text-xs text-n-4 mt-1">
                              {t.completed}: {new Date(selectedAppointment.completed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-n-6" />

                      {/* Chief Complaint */}
                      {selectedAppointment.chief_complaint && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.chiefComplaint}</h3>
                            <p className={`text-sm text-n-1 leading-relaxed ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>{selectedAppointment.chief_complaint}</p>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Symptoms */}
                      {selectedAppointment.symptoms && Array.isArray(selectedAppointment.symptoms) && selectedAppointment.symptoms.length > 0 && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.symptoms}</h3>
                            <div className="space-y-2">
                              {selectedAppointment.symptoms.map((symptom: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-n-6 bg-n-9/40">
                                  <p className="text-sm font-medium text-n-1">{symptom.name || `${language === "en" ? "Symptom" : "علامت"} ${index + 1}`}</p>
                                  {symptom.severity && (
                                    <p className="text-xs text-n-4 mt-1">{t.severity}: {symptom.severity}</p>
                                  )}
                                  {symptom.duration && (
                                    <p className="text-xs text-n-4">{t.duration}: {symptom.duration}</p>
                                  )}
                                  {symptom.notes && (
                                    <p className="text-xs text-n-3 mt-1">{symptom.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Diagnosis */}
                      {selectedAppointment.diagnosis && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.diagnosis}</h3>
                            <p className={`text-sm text-n-1 leading-relaxed ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>{selectedAppointment.diagnosis}</p>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Examination Findings */}
                      {selectedAppointment.examination_findings && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.examinationFindings}</h3>
                            <p className={`text-sm text-n-1 leading-relaxed ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>{selectedAppointment.examination_findings}</p>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Vital Signs */}
                      {selectedAppointment.vital_signs && typeof selectedAppointment.vital_signs === 'object' && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.vitalSigns}</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedAppointment.vital_signs.blood_pressure && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">{t.bloodPressure}</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.blood_pressure}</p>
                                </div>
                              )}
                              {selectedAppointment.vital_signs.heart_rate && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">{t.heartRate}</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.heart_rate}</p>
                                </div>
                              )}
                              {selectedAppointment.vital_signs.temperature && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">{t.temperature}</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.temperature}</p>
                                </div>
                              )}
                              {selectedAppointment.vital_signs.weight && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">{t.weight}</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.weight}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Prescription */}
                      {selectedAppointment.prescription && Array.isArray(selectedAppointment.prescription) && selectedAppointment.prescription.length > 0 && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.prescription}</h3>
                            <div className="space-y-2">
                              {selectedAppointment.prescription.map((med: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-n-6 bg-n-9/40">
                                  <p className="text-sm font-medium text-n-1">{med.medication || `${t.medication} ${index + 1}`}</p>
                                  <div className="mt-2 space-y-1">
                                    {med.dosage && (
                                      <p className="text-xs text-n-4">{t.dosage}: {med.dosage}</p>
                                    )}
                                    {med.frequency && (
                                      <p className="text-xs text-n-4">{t.frequency}: {med.frequency}</p>
                                    )}
                                    {med.duration && (
                                      <p className="text-xs text-n-4">{t.duration}: {med.duration}</p>
                                    )}
                                    {med.instructions && (
                                      <p className="text-xs text-n-3 mt-1">{med.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Lab Tests */}
                      {selectedAppointment.lab_tests && Array.isArray(selectedAppointment.lab_tests) && selectedAppointment.lab_tests.length > 0 && (
                        <>
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.labTests}</h3>
                            <div className="space-y-2">
                              {selectedAppointment.lab_tests.map((test: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-n-6 bg-n-9/40">
                                  <p className="text-sm font-medium text-n-1">{test.test_name || `${t.testName} ${index + 1}`}</p>
                                  {test.reason && (
                                    <p className="text-xs text-n-4 mt-1">{t.reason}: {test.reason}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Follow-up */}
                      {(selectedAppointment.follow_up_date || selectedAppointment.follow_up_notes) && (
                        <div>
                          <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.followUp}</h3>
                          <div className="space-y-1">
                            {selectedAppointment.follow_up_date && (
                              <p className="text-sm text-n-1">
                                {t.date}: {new Date(selectedAppointment.follow_up_date).toLocaleDateString()}
                              </p>
                            )}
                            {selectedAppointment.follow_up_notes && (
                              <p className="text-sm text-n-1 leading-relaxed mt-2">{selectedAppointment.follow_up_notes}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Transcription */}
                      {selectedAppointment.transcription && (
                        <>
                          <Separator className="bg-n-6" />
                          <div>
                            <h3 className={`text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif" } : {}}>{t.transcription}</h3>
                            <p className={`text-sm text-n-2 leading-relaxed whitespace-pre-wrap ${language === "ur" ? "font-urdu" : ""}`} style={language === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif", direction: "rtl" } : { direction: "ltr" }}>{selectedAppointment.transcription}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
