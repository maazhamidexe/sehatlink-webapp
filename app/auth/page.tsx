"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { LocationPrompt } from "@/components/location-prompt"
import { PatientSignupForm } from "@/components/patient-signup-form"

export default function AuthPage() {
  const router = useRouter()
  const { login, signup, checkLocationStatus, updateLocation } = useAuth()
  
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      await login(email, password)
      
      // Check if location needs to be collected
      try {
        console.log("Checking location status...")
        const locationStatus = await checkLocationStatus()
        console.log("Location status response:", locationStatus)
        
        if (locationStatus.needsLocation) {
          console.log("Showing location prompt")
          setShowLocationPrompt(true)
          setLoading(false)
        } else {
          console.log("Location not needed, redirecting to chat")
          router.push("/chat")
        }
      } catch (locErr) {
        console.error("Location check failed:", locErr)
        // Show location prompt anyway since check failed
        setShowLocationPrompt(true)
        setLoading(false)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || "Login failed")
      setLoading(false)
    }
  }

  const handleLocationGranted = async (latitude: number, longitude: number) => {
    try {
      await updateLocation(latitude, longitude)
      setShowLocationPrompt(false)
      router.push("/chat")
    } catch (err: any) {
      console.error("Failed to update location:", err)
      console.error("Error response data:", err.response?.data)
      // Show user-friendly error message
      setError(err.response?.data?.error || err.response?.data?.details || "Failed to save location. Please try again.")
      throw err
    }
  }

  const handleSkipLocation = () => {
    setShowLocationPrompt(false)
    router.push("/chat")
  }

  const handleSignupSuccess = () => {
    alert("Signup successful! Please login.")
    setMode("login")
    setEmail("")
    setPassword("")
    setName("")
    setError("")
  }

  const handleSignupCancel = () => {
    setMode("login")
    setError("")
  }

  return (
    <>
      {showLocationPrompt && (
        <LocationPrompt
          onLocationGranted={handleLocationGranted}
          onSkip={handleSkipLocation}
        />
      )}
      
      <div className="flex min-h-screen items-center justify-center bg-n-8 text-n-1 p-4 font-sora">
        {mode === "signup" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <PatientSignupForm
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
                  <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
                </div>
                <CardTitle className="text-2xl text-n-1">
                  Welcome Back
                </CardTitle>
                <p className="text-sm text-n-2">
                  Sign in to access your healthcare dashboard
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        handleLogin()
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
                    onClick={() => router.push("/auth/doctor")}
                    className="text-sm text-n-3 hover:text-n-1 transition-colors"
                  >
                    Are you a doctor? Login here →
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </>
  )
}
