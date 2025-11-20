'use client';

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
  Mic,
  Paperclip,
  Send,
  Activity,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MedicineReminderCard } from "@/components/medicine-reminder-card"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface Agent {
  id: string
  name: string
  description: string
  active: boolean
}

const agents: Agent[] = [
  { 
    id: "1", 
    name: "Health Assistant", 
    description: "Managing your medication reminders and scheduling",
    active: true 
  },
  { 
    id: "2", 
    name: "Diagnostic Agent", 
    description: "Analyzing symptoms and providing preliminary insights",
    active: false 
  },
  { 
    id: "3", 
    name: "Care Coordinator", 
    description: "Coordinating with healthcare providers",
    active: false 
  },
]

export default function Home() {
  const router = useRouter()
  const { token, userId, loggedIn, loading, logout, setSessionData } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [activeAgent, setActiveAgent] = useState(0)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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

  // Start chat session and connect WebSocket
  useEffect(() => {
    if (!token || !loggedIn) return

    let ws: WebSocket | null = null

    const startChat = async () => {
      try {
        // Start chat session - use Next.js API proxy route to avoid SSL certificate issues
        const res = await axios.get("/api/proxy/chat-start", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        const newSessionId = res.data.session_id
        const newUserId = res.data.user_id
        
        setSessionData(newSessionId, newUserId)
        
        console.log("FROM FRONTEND\nSession:", newSessionId, "User ID:", newUserId)

        // Open WebSocket connection - fix URL (remove https:// from ws://)
        ws = new WebSocket("wss://34.42.175.232/ws/chat")

        ws.onopen = () => {
          console.log("WebSocket connected")
          // Add welcome message
          setMessages([{
            id: "1",
            text: "Hello! I'm your healthcare assistant. How can I help you today?",
            sender: "assistant",
            timestamp: new Date(),
          }])
        }

        ws.onmessage = (e) => {
          const data = JSON.parse(e.data)
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: data.response,
              agent: data.agent,
              sender: "assistant",
              timestamp: new Date(),
            },
          ])
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
        }

        ws.onclose = () => {
          console.log("WebSocket disconnected")
        }

        setSocket(ws)
      } catch (err) {
        console.error(err)
        alert("Failed to start chat session")
      }
    }

    startChat()

    // Cleanup WebSocket on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [token, loggedIn, setSessionData])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Rotate active agent for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % agents.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
  }

  const handleLogout = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close()
    }
    logout()
    router.push("/auth")
  }

  return (
    <div className="h-screen overflow-hidden bg-n-8 text-n-1 p-4 md:p-6 font-sora">
      <div className="mx-auto flex h-full max-h-full max-w-[1920px] flex-col gap-4 overflow-hidden lg:gap-6">
        {/* Header with Logout */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
            <h1 className="text-xl font-bold text-n-1">Sehat Link</h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 border-n-6 bg-n-7/50 text-n-1 hover:bg-n-7 hover:text-color-1 backdrop-blur-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
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
          <Card className="flex h-full max-h-full min-h-0 flex-col border-n-6 bg-n-7/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <CardContent className="flex min-h-0 flex-1 flex-col p-0 overflow-hidden">
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="flex-1 w-full">
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <AnimatePresence>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                message.sender === "user"
                                  ? "bg-color-1 text-n-8"
                                  : "bg-n-9/40 backdrop-blur text-n-1 border border-n-6 shadow-md"
                              }`}
                            >
                              <p className="text-sm leading-relaxed font-semibold">{message.text}</p>
                              <p className={`mt-1 text-xs ${message.sender === "user" ? "text-n-8/70" : "text-n-2"}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </ScrollArea>
              </div>
              <Separator className="shrink-0 border-n-6" />
              <div className="flex shrink-0 items-center gap-2 p-4 bg-n-7/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-n-2 hover:bg-n-9/40 hover:text-color-1"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-n-2 hover:bg-n-9/40 hover:text-color-1"
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleSend}
                  className="bg-conic-gradient text-n-8 hover:opacity-90 font-code font-bold uppercase tracking-wider"
                >
                  <Send className="h-4 w-4" />
                </Button>
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
          <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-n-1">
                <Activity className="h-5 w-5 text-n-2" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6 py-4">
                {agents.map((agent, index) => (
                  <div key={agent.id} className="flex flex-col items-center gap-4">
                    <motion.div
                      animate={{
                        scale: agent.id === agents[activeAgent].id ? [1, 1.1, 1] : 1,
                        opacity: agent.id === agents[activeAgent].id ? 1 : 0.4,
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 ${
                        agent.id === agents[activeAgent].id
                          ? "border-color-1 bg-conic-gradient"
                          : "border-n-6 bg-n-9/40"
                      }`}
                    >
                      {agent.id === agents[activeAgent].id && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-color-1 opacity-20"
                        />
                      )}
                      <Activity className={`h-6 w-6 ${agent.id === agents[activeAgent].id ? "text-n-8" : "text-n-2"}`} />
                    </motion.div>
                    {index < agents.length - 1 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: index * 0.2 }}
                        className="h-8 w-0.5 bg-n-6"
                      />
                    )}
                  </div>
                ))}
              </div>
              <Separator className="my-4 border-n-6" />
              <motion.div
                key={activeAgent}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-n-6 bg-n-9/40 backdrop-blur p-4"
              >
                <h3 className="mb-2 font-semibold text-n-1">
                  {agents[activeAgent].name}
                </h3>
                <p className="text-sm text-n-2">
                  {agents[activeAgent].description}
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
