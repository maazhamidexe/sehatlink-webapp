"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  token: string | null
  userId: string | null
  sessionId: string | null
  loggedIn: boolean
  loading: boolean
  userType: "patient" | "doctor" | null
  login: (email: string, password: string) => Promise<void>
  signup: (data: {
    email: string
    password: string
    name: string
    phone_no?: string | null
    dob?: string | null
    gender?: string | null
    city?: string | null
    last_hospital_visit?: string | null
    chronic_conditions?: string[] | null
    allergies?: string[] | null
    current_medications?: string[] | null
    past_prescriptions?: string[] | null
    language_preferred?: string[] | null
    communication_style?: string | null
    domicile_location?: string | null
  }) => Promise<void>
  logout: () => void
  setSessionData: (sessionId: string, userId: string) => void
  checkLocationStatus: () => Promise<{ needsLocation: boolean; patientId?: number }>
  updateLocation: (latitude: number, longitude: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<"patient" | "doctor" | null>(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    const savedUserId = localStorage.getItem("userId")
    const savedSessionId = localStorage.getItem("sessionId")
    const savedUserType = localStorage.getItem("user_type") as "patient" | "doctor" | null
    
    if (savedToken) {
      setToken(savedToken)
      setLoggedIn(true)
    }
    if (savedUserId) setUserId(savedUserId)
    if (savedSessionId) setSessionId(savedSessionId)
    if (savedUserType) setUserType(savedUserType)
    
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const axios = (await import("axios")).default
    
    // Use Next.js API proxy route to avoid SSL certificate issues
    const res = await axios.post("/api/proxy/login", {
      email,
      password,
    })

    const accessToken = res.data.access_token
    setToken(accessToken)
    setLoggedIn(true)
    setUserType("patient")
    localStorage.setItem("token", accessToken)
    localStorage.setItem("user_type", "patient")
  }

  const signup = async (data: {
    email: string
    password: string
    name: string
    phone_no?: string | null
    dob?: string | null
    gender?: string | null
    city?: string | null
    last_hospital_visit?: string | null
    chronic_conditions?: string[] | null
    allergies?: string[] | null
    current_medications?: string[] | null
    past_prescriptions?: string[] | null
    language_preferred?: string[] | null
    communication_style?: string | null
    domicile_location?: string | null
  }) => {
    const axios = (await import("axios")).default
    
    // Use Next.js API proxy route to avoid SSL certificate issues
    await axios.post("/api/proxy/signup", data)
  }

  const logout = () => {
    setToken(null)
    setUserId(null)
    setSessionId(null)
    setLoggedIn(false)
    setUserType(null)
    localStorage.removeItem("token")
    localStorage.removeItem("userId")
    localStorage.removeItem("sessionId")
    localStorage.removeItem("user_type")
    localStorage.removeItem("doctor_token")
  }

  const setSessionData = (newSessionId: string, newUserId: string) => {
    setSessionId(newSessionId)
    setUserId(newUserId)
    localStorage.setItem("sessionId", newSessionId)
    localStorage.setItem("userId", newUserId)
  }

  const checkLocationStatus = async () => {
    const axios = (await import("axios")).default
    const currentToken = localStorage.getItem("token")
    
    console.log("[AuthContext] Checking location with token:", currentToken ? "Token exists" : "No token")
    
    const res = await axios.post("/api/patient-location/check", {
      token: currentToken,
    })

    return res.data
  }

  const updateLocation = async (latitude: number, longitude: number) => {
    const axios = (await import("axios")).default
    const currentToken = localStorage.getItem("token")
    
    console.log("[AuthContext] Updating location with token:", currentToken ? "Token exists" : "No token")
    console.log("[AuthContext] Coordinates:", latitude, longitude)
    
    await axios.post("/api/patient-location/update", {
      token: currentToken,
      latitude,
      longitude,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        userId,
        sessionId,
        loggedIn,
        loading,
        userType,
        login,
        signup,
        logout,
        setSessionData,
        checkLocationStatus,
        updateLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
