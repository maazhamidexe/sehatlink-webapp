"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axios from "axios"

interface Hospital {
  id: number
  name: string
  address: string
  city: string
  contact_no?: string
}

interface NewHospitalDetails {
  name: string
  address: string
  city: string
  contact_no?: string | null
}

interface DoctorSignupPayload {
  name: string
  licence_no: string
  email: string
  password: string
  specialization?: string | null
  affiliation_type: string
  experience_years: number
  city: string
  existing_hospital_id?: number | null
  new_hospital_details?: NewHospitalDetails | null
  clinic_address?: string | null
}

export default function DoctorAuthPage() {
  const router = useRouter()
  
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  
  // Signup fields
  const [name, setName] = useState("")
  const [licenceNo, setLicenceNo] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [city, setCity] = useState("")
  const [experienceYears, setExperienceYears] = useState(5)
  
  // Affiliation fields
  const [affiliationType, setAffiliationType] = useState("Hospital")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null)
  
  // New hospital fields
  const [newHospitalName, setNewHospitalName] = useState("")
  const [newHospitalAddress, setNewHospitalAddress] = useState("")
  const [newHospitalCity, setNewHospitalCity] = useState("")
  const [newHospitalContact, setNewHospitalContact] = useState("")
  
  // Clinic address
  const [clinicAddress, setClinicAddress] = useState("")

  // Fetch hospitals on mount
  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    try {
      const response = await axios.get("/api/hospitals/list")
      setHospitals(response.data)
    } catch (err) {
      console.error("Failed to fetch hospitals:", err)
    }
  }

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
      console.error(err)
      const errorMsg = err.response?.data?.detail || err.response?.data?.suggestion || "Login failed"
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    // Validation
    if (!name || !licenceNo || !email || !password || !city) {
      setError("Please fill in all required fields marked with *")
      return
    }

    if (affiliationType === "Hospital" && !selectedHospitalId) {
      setError("Please select a hospital")
      return
    }

    if (affiliationType === "Register New Hospital" && (!newHospitalName || !newHospitalAddress || !newHospitalCity)) {
      setError("Please fill in all new hospital details")
      return
    }

    if (affiliationType === "Private Clinic" && !clinicAddress) {
      setError("Please enter clinic address")
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const payload: DoctorSignupPayload = {
        name,
        licence_no: licenceNo,
        email,
        password,
        specialization: specialization || null,
        affiliation_type: affiliationType,
        experience_years: experienceYears,
        city,
        existing_hospital_id: affiliationType === "Hospital" ? selectedHospitalId : null,
        new_hospital_details: affiliationType === "Register New Hospital" ? {
          name: newHospitalName,
          address: newHospitalAddress,
          city: newHospitalCity,
          contact_no: newHospitalContact || null,
        } : null,
        clinic_address: affiliationType === "Private Clinic" ? clinicAddress : null,
      }

      await axios.post("/api/proxy/doctor/signup", payload)
      
      alert("Signup successful! Please login.")
      setMode("login")
      // Reset form
      setPassword("")
      setLoginPassword("")
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.response?.data?.detail || err.response?.data?.suggestion || "Signup failed"
      setError(errorMsg)
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
        className="w-full max-w-2xl"
      >
        <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-conic-gradient">
              <svg className="w-8 h-8 text-n-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-n-1">
              {mode === "login" ? "Doctor Login" : "Doctor Registration"}
            </CardTitle>
            <p className="text-sm text-n-2">
              {mode === "login" 
                ? "Sign in to access your doctor dashboard" 
                : "Register as a healthcare professional"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "login" ? (
              <>
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
              </>
            ) : (
              <>
                {/* Core Doctor Details */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-n-1">Core Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        placeholder="Dr. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        License No *
                      </label>
                      <Input
                        type="text"
                        placeholder="ABC123456"
                        value={licenceNo}
                        onChange={(e) => setLicenceNo(e.target.value)}
                        className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        placeholder="doctor@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        Specialization
                      </label>
                      <Input
                        type="text"
                        placeholder="Cardiology, Neurology, etc."
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        City *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-n-1">
                      Years of Experience: {experienceYears}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                      className="w-full h-2 bg-n-6 rounded-lg appearance-none cursor-pointer accent-color-1"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Affiliation Details */}
                <div className="space-y-3 border-t border-n-6 pt-4">
                  <h3 className="text-lg font-semibold text-n-1">Affiliation Details</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-n-1">
                      Affiliation Type *
                    </label>
                    <select
                      value={affiliationType}
                      onChange={(e) => setAffiliationType(e.target.value)}
                      className="w-full border border-n-6 bg-n-9/40 backdrop-blur text-n-1 rounded-md px-3 py-2 focus:outline-none focus:border-color-1"
                      disabled={loading}
                    >
                      <option value="Hospital">Hospital</option>
                      <option value="Register New Hospital">Register New Hospital</option>
                      <option value="Private Clinic">Private Clinic</option>
                    </select>
                  </div>

                  {affiliationType === "Hospital" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        Select Hospital *
                      </label>
                      <select
                        value={selectedHospitalId || ""}
                        onChange={(e) => setSelectedHospitalId(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full border border-n-6 bg-n-9/40 backdrop-blur text-n-1 rounded-md px-3 py-2 focus:outline-none focus:border-color-1"
                        disabled={loading}
                      >
                        <option value="">-- Select Hospital --</option>
                        {hospitals.map((hospital) => (
                          <option key={hospital.id} value={hospital.id}>
                            {hospital.name} - {hospital.city}
                          </option>
                        ))}
                      </select>
                      {selectedHospitalId && (
                        <p className="text-xs text-n-3">Hospital ID: {selectedHospitalId}</p>
                      )}
                    </div>
                  )}

                  {affiliationType === "Register New Hospital" && (
                    <div className="space-y-3 p-3 border border-n-6 rounded-md bg-n-8/30">
                      <p className="text-xs text-n-3">Fill details for the new hospital</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-n-1">
                            Hospital Name *
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter hospital name"
                            value={newHospitalName}
                            onChange={(e) => setNewHospitalName(e.target.value)}
                            className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-n-1">
                            Hospital City *
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter city"
                            value={newHospitalCity}
                            onChange={(e) => setNewHospitalCity(e.target.value)}
                            className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-n-1">
                            Hospital Address *
                          </label>
                          <Input
                            type="text"
                            placeholder="Enter full address"
                            value={newHospitalAddress}
                            onChange={(e) => setNewHospitalAddress(e.target.value)}
                            className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-n-1">
                            Contact Number
                          </label>
                          <Input
                            type="text"
                            placeholder="Optional"
                            value={newHospitalContact}
                            onChange={(e) => setNewHospitalContact(e.target.value)}
                            className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {affiliationType === "Private Clinic" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-n-1">
                        Clinic Address *
                      </label>
                      <textarea
                        placeholder="Enter full clinic address"
                        value={clinicAddress}
                        onChange={(e) => setClinicAddress(e.target.value)}
                        rows={3}
                        className="w-full border border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 rounded-md px-3 py-2 focus:outline-none focus:border-color-1"
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

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
                onClick={() => router.push("/auth")}
                className="text-sm text-n-3 hover:text-n-1 transition-colors"
              >
                ← Back to Patient Login
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
