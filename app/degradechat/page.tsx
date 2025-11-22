'use client';

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
  Send,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
  isStreaming?: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function DegradeChat() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [waitingForResponse, setWaitingForResponse] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        setIsLoading(true)
        const response = await axios.post(`${API_BASE_URL}/degraded/new-session`)
        setSessionId(response.data.session_id)
        setMessages([{
          id: "1",
          text: "Hello! I'm your healthcare assistant in offline mode. How can I help you today?",
          sender: "assistant",
          timestamp: new Date(),
        }])
      } catch (error: any) {
        console.error("Failed to create degraded session:", error)
        alert("Failed to initialize offline mode. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    createSession()
  }, [])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fast text streaming effect
  const streamText = (text: string, messageId: string) => {
    const chars = text.split("")
    let currentIndex = 0
    const streamSpeed = 5

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
      }
    }, streamSpeed)
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setWaitingForResponse(true)

    // Add user message
    const userMessageId = Date.now().toString()
    const newUserMessage: Message = {
      id: userMessageId,
      text: userMessage,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newUserMessage])

    try {
      // Call degraded chat endpoint
      const response = await axios.post(`${API_BASE_URL}/degraded/chat`, {
        session_id: sessionId,
        message: userMessage,
      })

      // Create assistant message with streaming
      const assistantMessageId = (Date.now() + 1).toString()
      const newAssistantMessage: Message = {
        id: assistantMessageId,
        text: "", // Start empty for streaming
        sender: "assistant",
        timestamp: new Date(),
        isStreaming: true,
      }
      setMessages((prev) => [...prev, newAssistantMessage])

      // Stream the response
      streamText(response.data.response, assistantMessageId)
    } catch (error: any) {
      console.error("Chat error:", error)
      const errorMessage = error.response?.data?.detail || error.message || "Failed to send message"
      
      // Add error message
      const errorMessageId = (Date.now() + 2).toString()
      setMessages((prev) => [...prev, {
        id: errorMessageId,
        text: `Error: ${errorMessage}`,
        sender: "assistant",
        timestamp: new Date(),
      }])
    } finally {
      setWaitingForResponse(false)
    }
  }

  const handleNormalMode = () => {
    router.push("/chat")
  }

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        axios.post(`${API_BASE_URL}/degraded/end-session`, {
          session_id: sessionId,
        }).catch(console.error)
      }
    }
  }, [sessionId])

  return (
    <div className="relative h-screen overflow-hidden bg-gray-900 text-gray-100 p-4 md:p-6 font-sora">
      {/* Grey background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 via-transparent to-gray-800/50" />
      </div>

      <div className="relative mx-auto flex h-full max-h-full max-w-[1920px] flex-col gap-4 overflow-hidden lg:gap-6 z-10">
        {/* Header with Offline Mode label and Normal Mode button */}
        <div className="flex items-center justify-between relative z-50">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-gray-400" />
            <h1 className="text-xl font-bold text-gray-300">Offline Mode</h1>
          </div>
          <Button
            onClick={handleNormalMode}
            variant="outline"
            className="flex items-center gap-2 border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-gray-100 backdrop-blur-sm"
          >
            <Wifi className="h-4 w-4" />
            Normal Mode
          </Button>
        </div>

        {/* Center Chat - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex h-full min-h-0 flex-col"
        >
          <Card className="relative flex h-full max-h-full min-h-0 flex-col border-gray-700 bg-gray-800/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <CardContent className="flex min-h-0 flex-1 flex-col p-0 overflow-hidden">
              <div className="flex min-h-0 flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="flex-1 w-full">
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      {isLoading && (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      )}
                      <AnimatePresence>
                        {messages.map((message) => {
                          return (
                            <motion.div
                              key={message.id}
                              id={message.id}
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 relative ${
                                  message.sender === "user"
                                    ? "bg-gray-700 text-gray-100"
                                    : "bg-gray-700/60 backdrop-blur text-gray-200 border border-gray-600 shadow-lg"
                                } ${message.isStreaming ? "border-l-2 border-gray-500" : ""}`}
                              >
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-start gap-2">
                                    <div className="text-sm leading-relaxed font-medium flex-1 prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                                      <ReactMarkdown
                                        components={{
                                          p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                          em: ({ children }) => <em className="italic">{children}</em>,
                                          code: ({ children, className }) => {
                                            const isInline = !className
                                            return isInline ? (
                                              <code className="bg-gray-900/80 px-1.5 py-0.5 rounded text-xs font-mono">
                                                {children}
                                              </code>
                                            ) : (
                                              <code className="block bg-gray-900/80 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto">
                                                {children}
                                              </code>
                                            )
                                          },
                                          pre: ({ children }) => (
                                            <pre className="bg-gray-900/80 p-3 rounded text-xs font-mono whitespace-pre overflow-x-auto mb-2 last:mb-0">
                                              {children}
                                            </pre>
                                          ),
                                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                          li: ({ children }) => <li className="ml-4">{children}</li>,
                                          blockquote: ({ children }) => (
                                            <blockquote className="border-l-4 border-gray-600 pl-4 italic mb-2">
                                              {children}
                                            </blockquote>
                                          ),
                                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                          h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                                          hr: () => <hr className="my-2 border-gray-600" />,
                                        }}
                                      >
                                        {message.text}
                                      </ReactMarkdown>
                                      {message.isStreaming && (
                                        <motion.span
                                          className="inline-block w-0.5 h-4 ml-1 bg-gray-400"
                                          animate={{ opacity: [1, 0, 1] }}
                                          transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                      {waitingForResponse && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-start px-2 py-1"
                        >
                          <p className="text-sm text-gray-500 italic font-light">
                            Processing...
                          </p>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </ScrollArea>
              </div>
              <Separator className="shrink-0 border-gray-700" />
              <div className="relative flex shrink-0 items-center gap-2 p-4 bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50">
                <div className="relative flex-1">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type your message..."
                    className="w-full border-gray-700 bg-gray-900/60 backdrop-blur text-gray-200 placeholder:text-gray-500 focus-visible:border-gray-600 focus-visible:shadow-lg transition-all duration-300"
                    disabled={isLoading || !sessionId}
                  />
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading || !sessionId}
                    className="bg-gray-700 text-gray-100 hover:bg-gray-600 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

