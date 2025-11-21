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
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Separator } from "@/components/ui/separator"
import { MedicineReminderCard } from "@/components/medicine-reminder-card"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant" | "system"
  timestamp: Date
  agent?: string
  isStreaming?: boolean
  isBridging?: boolean
}

interface AgentInfo {
  name: string
  icon: React.ReactNode
  color: string
  description: string
  lastActive: Date | null
}

// Agent mapping with icons and colors
const getAgentInfo = (agentName: string): AgentInfo => {
  const agentMap: Record<string, AgentInfo> = {
    "Triage Agent": {
      name: "Triage Agent",
      icon: <ClipboardList className="h-6 w-6" />,
      color: "#79fff7",
      description: "Assessing your needs and routing to the appropriate specialist",
      lastActive: null,
    },
    "Health Assistant": {
      name: "Health Assistant",
      icon: <Heart className="h-6 w-6" />,
      color: "#ff776f",
      description: "Managing your medication reminders and scheduling",
      lastActive: null,
    },
    "Diagnostic Agent": {
      name: "Diagnostic Agent",
      icon: <Stethoscope className="h-6 w-6" />,
      color: "#ac6aff",
      description: "Analyzing symptoms and providing preliminary insights",
      lastActive: null,
    },
    "Care Coordinator": {
      name: "Care Coordinator",
      icon: <UserCheck className="h-6 w-6" />,
      color: "#7adb78",
      description: "Coordinating with healthcare providers",
      lastActive: null,
    },
    "Medication Manager": {
      name: "Medication Manager",
      icon: <Pill className="h-6 w-6" />,
      color: "#858dff",
      description: "Tracking and managing your medications",
      lastActive: null,
    },
    "AI Assistant": {
      name: "AI Assistant",
      icon: <Brain className="h-6 w-6" />,
      color: "#ffc876",
      description: "General health assistance and information",
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
    const trimmed = agentData.trim()
    if (trimmed && trimmed !== "null" && trimmed !== "undefined") {
      return trimmed
    }
  }

  if (agentData && typeof agentData === "object") {
    const possibleName =
      (agentData as { name?: string; agent?: string }).name ??
      (agentData as { name?: string; agent?: string }).agent

    if (typeof possibleName === "string") {
      const trimmed = possibleName.trim()
      if (trimmed) {
        return trimmed
      }
    }
  }

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
          text: "Hello! I'm your healthcare assistant. How can I help you today?",
          sender: "assistant",
          agent: "Triage Agent",
          timestamp: new Date(),
        }])
      }

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data)
        const agentName = getSafeAgentName(data.agent)
        const responseText = getSafeResponseText(data.response)
        
        // Update current agent
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
        "Failed to start chat session"
      
      // Show detailed error in alert
      const statusCode = err.response?.status ? ` (Status: ${err.response.status})` : ''
      alert(`Failed to start chat session${statusCode}: ${errorMessage}`)
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
      "Thinking...",
      "Processing request...",
      "Analyzing context...",
      "Routing to appropriate agent...",
      "Calling necessary tools...",
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
    const streamSpeed = 15 // Fast streaming (lower = faster)

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
    const confirmed = window.confirm("Doing this will delete the session. Do you want to continue?")
    
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
        "Failed to start new chat"
      alert(`Failed to start new chat: ${errorMessage}`)
    }
  }

  const fetchMedicineStatusNotifications = async () => {
    if (!userId) {
      setNotificationError("You need to be logged in to view notifications.")
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
        "Unable to fetch notifications."
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
            <h1 className="text-xl font-bold text-n-1">Sehat Link</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationsRef}>
              <Button
                onClick={handleNotificationsClick}
                variant="outline"
                className="flex items-center gap-2 border-n-6 bg-n-7/50 text-n-1 hover:bg-n-7 hover:text-color-1 backdrop-blur-sm"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </Button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-n-6 bg-n-8/95 backdrop-blur-xl shadow-2xl z-20">
                  <div className="border-b border-n-6/60 px-4 py-3">
                    <p className="text-sm font-semibold text-n-1">Medicine Follow-up</p>
                    <p className="text-xs text-n-4">Latest adherence insights</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3">
                    {notificationLoading && (
                      <div className="flex items-center gap-2 text-n-3 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fetching notifications...
                      </div>
                    )}
                    {!notificationLoading && notificationError && (
                      <div className="flex items-start gap-2 text-xs text-red-300">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>{notificationError}</span>
                      </div>
                    )}
                    {!notificationLoading && !notificationError && notificationMessages.length === 0 && (
                      <p className="text-sm text-n-4">You&apos;re all caught up. No new alerts.</p>
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
              className="flex items-center gap-2 border-n-6 bg-n-7/50 text-n-1 hover:bg-n-7 hover:text-color-1 backdrop-blur-sm"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 border-n-6 bg-n-7/50 text-n-1 hover:bg-n-7 hover:text-color-1 backdrop-blur-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
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
                                      {message.agent}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-start gap-2">
                                  <p className="text-sm leading-relaxed font-medium flex-1">
                                    {message.text}
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
                                  </p>
                                </div>
                                {!isBridging && (
                                  <p className={`mt-2 text-xs ${message.sender === "user" ? "text-n-8/70" : "text-n-3"}`}>
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
                          <p className="text-sm text-n-4 italic font-light">
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
                    placeholder="Type your message..."
                    className="w-full border-n-6 bg-n-9/60 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1 focus-visible:shadow-lg focus-visible:shadow-color-1/20 transition-all duration-300"
                    style={{
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
                          <p className="text-xs text-n-4">
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
    </div>
  )
}
