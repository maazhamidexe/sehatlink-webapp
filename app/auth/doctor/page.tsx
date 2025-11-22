"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DoctorSignupForm } from "@/components/doctor-signup-form"
import axios from "axios"

export default function DoctorAuthPage() {
  const router = useRouter()
  
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const response = await axios.post("/api/proxy/doctor/login", {
        email: loginEmail,
        password: loginPassword,
      })
      
      // Store the access token
      localStorage.setItem("doctor_token", response.data.access_token)
      localStorage.setItem("user_type", "doctor")
      
      // Store doctor_id if provided in the response
      if (response.data.doctor_id) {
        localStorage.setItem("doctor_id", response.data.doctor_id.toString())
      } else if (response.data.user_id) {
        localStorage.setItem("doctor_id", response.data.user_id.toString())
      } else if (response.data.id) {
        localStorage.setItem("doctor_id", response.data.id.toString())
      }
      
      // Store doctor email for fallback lookup
      if (loginEmail) {
        localStorage.setItem("doctor_email", loginEmail)
      }
      
      router.push("/doctor/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      console.error("Error response data:", err.response?.data)
      console.error("Error status:", err.response?.status)
      console.error("Full error object:", JSON.stringify(err.response?.data, null, 2))
      
      const errorMsg = err.response?.data?.detail || err.response?.data?.suggestion || err.response?.data?.endpoint || err.message || "Login failed"
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSuccess = () => {
    alert("Signup successful! Please login.")
    setMode("login")
    setLoginEmail("")
    setLoginPassword("")
    setError("")
  }

  const handleSignupCancel = () => {
    setMode("login")
    setError("")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-n-8 text-n-1 p-4 font-sora">
      {mode === "signup" ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <DoctorSignupForm
            onSuccess={handleSignupSuccess}
            onCancel={handleSignupCancel}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-n-7 border border-n-6">
                <svg className="w-8 h-8 text-n-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-n-1">
                Doctor Login
              </CardTitle>
              <p className="text-sm text-n-2">
                Sign in to access your doctor dashboard
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-n-1">
                  Email *
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-n-1">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin()
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
                onClick={handleLogin}
                className="w-full bg-color-1 text-n-8 hover:opacity-90 font-medium"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Sign In"}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setMode("signup")
                    setError("")
                  }}
                  className="text-sm text-n-2 hover:text-color-1 transition-colors"
                  disabled={loading}
                >
                  Don't have an account? Sign up
                </button>
              </div>

              <div className="text-center pt-2 border-t border-n-6">
                <button
                  onClick={() => router.push("/auth")}
                  className="text-sm text-n-3 hover:text-n-1 transition-colors"
                >
                  ← Back to Patient Login
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
