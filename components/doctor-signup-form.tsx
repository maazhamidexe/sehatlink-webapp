"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface DoctorSignupData {
  // Required fields
  name: string
  licence_no: string
  email: string
  password: string
  
  // Optional professional details
  specialization?: string
  experience_years?: number
  city?: string
  
  // Affiliation details
  affiliation_type: string
  existing_hospital_id?: number | null
  new_hospital_details?: NewHospitalDetails | null
  clinic_address?: string | null
}

interface DoctorSignupFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    description: "Your account credentials",
  },
  {
    id: 2,
    title: "Professional Details",
    description: "Tell us about your practice",
  },
  {
    id: 3,
    title: "Affiliation",
    description: "Your workplace details",
  },
]

export function DoctorSignupForm({ onSuccess, onCancel }: DoctorSignupFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  
  const [formData, setFormData] = useState<DoctorSignupData>({
    name: "",
    licence_no: "",
    email: "",
    password: "",
    specialization: "",
    experience_years: 5,
    city: "",
    affiliation_type: "Hospital",
    existing_hospital_id: null,
    new_hospital_details: null,
    clinic_address: "",
  })

  const [newHospitalData, setNewHospitalData] = useState({
    name: "",
    address: "",
    city: "",
    contact_no: "",
  })

  // Fetch hospitals on mount
  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    try {
      const response = await axios.get("/api/proxy/hospitals/list")
      setHospitals(response.data)
    } catch (err) {
      console.error("Failed to fetch hospitals:", err)
    }
  }

  const updateField = (field: keyof DoctorSignupData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const updateNewHospitalField = (field: keyof NewHospitalDetails, value: string) => {
    setNewHospitalData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError("Name is required")
        return false
      }
      if (!formData.licence_no.trim()) {
        setError("License number is required")
        return false
      }
      if (!formData.email.trim()) {
        setError("Email is required")
        return false
      }
      if (!formData.password || formData.password.length < 6) {
        setError("Password must be at least 6 characters")
        return false
      }
    }
    
    if (step === 3) {
      if (formData.affiliation_type === "Hospital" && !formData.existing_hospital_id) {
        setError("Please select a hospital")
        return false
      }
      if (formData.affiliation_type === "Register New Hospital") {
        if (!newHospitalData.name.trim() || !newHospitalData.address.trim() || !newHospitalData.city.trim()) {
          setError("Please fill in all required hospital details")
          return false
        }
      }
      if (formData.affiliation_type === "Private Clinic" && !formData.clinic_address?.trim()) {
        setError("Please enter clinic address")
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1)
        setError("")
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError("")
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    setError("")

    try {
      const payload: any = {
        name: formData.name,
        licence_no: formData.licence_no,
        email: formData.email,
        password: formData.password,
        affiliation_type: formData.affiliation_type,
      }

      // Add optional professional details
      if (formData.specialization?.trim()) payload.specialization = formData.specialization.trim()
      if (formData.experience_years) payload.experience_years = formData.experience_years
      if (formData.city?.trim()) payload.city = formData.city.trim()

      // Add affiliation-specific fields
      if (formData.affiliation_type === "Hospital") {
        payload.existing_hospital_id = formData.existing_hospital_id
      } else if (formData.affiliation_type === "Register New Hospital") {
        payload.new_hospital_details = {
          name: newHospitalData.name.trim(),
          address: newHospitalData.address.trim(),
          city: newHospitalData.city.trim(),
          contact_no: newHospitalData.contact_no.trim() || null,
        }
      } else if (formData.affiliation_type === "Private Clinic") {
        payload.clinic_address = formData.clinic_address?.trim() || null
      }

      await axios.post("/api/proxy/doctor/signup", payload)
      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || err.response?.data?.suggestion || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Full Name <span className="text-color-3">*</span>
              </label>
              <Input
                type="text"
                placeholder="Dr. John Doe"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                License Number <span className="text-color-3">*</span>
              </label>
              <Input
                type="text"
                placeholder="Enter your medical license number"
                value={formData.licence_no}
                onChange={(e) => updateField("licence_no", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Email <span className="text-color-3">*</span>
              </label>
              <Input
                type="email"
                placeholder="doctor@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Password <span className="text-color-3">*</span>
              </label>
              <Input
                type="password"
                placeholder="Enter your password (min. 6 characters)"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Specialization
              </label>
              <Input
                type="text"
                placeholder="e.g., Cardiology, Neurology, Pediatrics"
                value={formData.specialization || ""}
                onChange={(e) => updateField("specialization", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Years of Experience: {formData.experience_years || 0}
              </label>
              <input
                type="range"
                min="0"
                max="60"
                value={formData.experience_years || 0}
                onChange={(e) => updateField("experience_years", parseInt(e.target.value))}
                className="w-full h-2 bg-n-6 rounded-lg appearance-none cursor-pointer accent-color-1"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-n-4">
                <span>0</span>
                <span>60</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                City
              </label>
              <Input
                type="text"
                placeholder="Enter your city"
                value={formData.city || ""}
                onChange={(e) => updateField("city", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Affiliation Type <span className="text-color-3">*</span>
              </label>
              <select
                value={formData.affiliation_type}
                onChange={(e) => {
                  updateField("affiliation_type", e.target.value)
                  // Reset related fields when changing affiliation type
                  updateField("existing_hospital_id", null)
                  updateField("clinic_address", "")
                  setNewHospitalData({ name: "", address: "", city: "", contact_no: "" })
                }}
                className="w-full h-9 rounded-md border border-n-6 bg-n-9/40 backdrop-blur text-n-1 px-3 text-sm focus-visible:border-color-1 focus-visible:outline-none disabled:opacity-50"
                disabled={loading}
              >
                <option value="Hospital">Hospital</option>
                <option value="Register New Hospital">Register New Hospital</option>
                <option value="Private Clinic">Private Clinic</option>
              </select>
            </div>

            {formData.affiliation_type === "Hospital" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-n-1">
                  Select Hospital <span className="text-color-3">*</span>
                </label>
                <select
                  value={formData.existing_hospital_id || ""}
                  onChange={(e) => updateField("existing_hospital_id", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full h-9 rounded-md border border-n-6 bg-n-9/40 backdrop-blur text-n-1 px-3 text-sm focus-visible:border-color-1 focus-visible:outline-none disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="">-- Select Hospital --</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name} - {hospital.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.affiliation_type === "Register New Hospital" && (
              <div className="space-y-4 p-4 border border-n-6 rounded-md bg-n-8/30">
                <p className="text-sm text-n-2">Fill in details for the new hospital</p>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-n-1">
                    Hospital Name <span className="text-color-3">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter hospital name"
                    value={newHospitalData.name}
                    onChange={(e) => updateNewHospitalField("name", e.target.value)}
                    className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-n-1">
                    Hospital City <span className="text-color-3">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter city"
                    value={newHospitalData.city}
                    onChange={(e) => updateNewHospitalField("city", e.target.value)}
                    className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-n-1">
                    Hospital Address <span className="text-color-3">*</span>
                  </label>
                  <textarea
                    placeholder="Enter full address"
                    value={newHospitalData.address}
                    onChange={(e) => updateNewHospitalField("address", e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 px-3 py-2 text-sm focus-visible:border-color-1 focus-visible:outline-none disabled:opacity-50"
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
                    value={newHospitalData.contact_no}
                    onChange={(e) => updateNewHospitalField("contact_no", e.target.value)}
                    className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {formData.affiliation_type === "Private Clinic" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-n-1">
                  Clinic Address <span className="text-color-3">*</span>
                </label>
                <textarea
                  placeholder="Enter full clinic address"
                  value={formData.clinic_address || ""}
                  onChange={(e) => updateField("clinic_address", e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 px-3 py-2 text-sm focus-visible:border-color-1 focus-visible:outline-none disabled:opacity-50"
                  disabled={loading}
                />
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-n-7 border border-n-6">
            <svg className="w-8 h-8 text-n-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-n-1 mb-2">
            Doctor Registration
          </CardTitle>
          <p className="text-sm text-n-2">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
          </p>
        </CardHeader>

        {/* Progress Indicator */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep > step.id
                        ? "bg-color-1 text-n-8"
                        : currentStep === step.id
                        ? "bg-color-1 text-n-8 ring-2 ring-color-1/50"
                        : "bg-n-6 text-n-4"
                    }`}
                  >
                    {currentStep > step.id ? "✓" : step.id}
                  </div>
                  <p
                    className={`text-xs mt-1 text-center ${
                      currentStep >= step.id ? "text-n-1" : "text-n-4"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-all ${
                      currentStep > step.id ? "bg-color-1" : "bg-n-6"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-color-3/50 bg-color-3/10 p-3 text-sm text-color-3"
            >
              {error}
            </motion.div>
          )}

          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="outline"
                className="flex-1 border-n-6 bg-n-9/40 text-n-1 hover:bg-n-8"
                disabled={loading}
              >
                Previous
              </Button>
            )}
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-color-1 text-n-8 hover:opacity-90 font-medium"
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 bg-color-1 text-n-8 hover:opacity-90 font-medium"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            )}
          </div>

          <div className="text-center pt-2 border-t border-n-6">
            <button
              onClick={onCancel}
              className="text-sm text-n-3 hover:text-n-1 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}