"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthPage() {
  const router = useRouter()
  const { login, signup } = useAuth()
  
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      await login(email, password)
      router.push("/chat")
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      await signup(email, password, name)
      alert("Signup successful! Please login.")
      setMode("login")
      setPassword("")
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-n-8 text-n-1 p-4 font-sora">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-conic-gradient">
              <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
            </div>
            <CardTitle className="text-2xl text-n-1">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <p className="text-sm text-n-2">
              {mode === "login" 
                ? "Sign in to access your healthcare dashboard" 
                : "Sign up to get started with Sehat Link"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-n-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    mode === "login" ? handleLogin() : handleSignup()
                  }
                }}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-color-3/50 bg-color-3/10 p-3 text-sm text-color-3"
              >
                {error}
              </motion.div>
            )}

            <Button
              onClick={mode === "login" ? handleLogin : handleSignup}
              className="w-full bg-conic-gradient text-n-8 hover:opacity-90 font-code font-bold uppercase tracking-wider"
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
            </Button>

            <div className="text-center">
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login")
                  setError("")
                }}
                className="text-sm text-n-2 hover:text-color-1 transition-colors"
                disabled={loading}
              >
                {mode === "login" 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="text-center pt-2 border-t border-n-6">
              <button
                onClick={() => router.push("/auth/doctor")}
                className="text-sm text-n-3 hover:text-n-1 transition-colors"
              >
                Are you a doctor? Login here →
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
