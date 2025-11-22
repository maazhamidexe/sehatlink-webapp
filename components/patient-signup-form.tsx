"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

interface PatientSignupData {
  // Required fields
  name: string
  email: string
  password: string
  
  // Optional personal details
  phone_no?: string
  dob?: string
  gender?: string
  city?: string
  
  // Optional medical history
  last_hospital_visit?: string
  chronic_conditions?: string[]
  allergies?: string[]
  current_medications?: string[]
  past_prescriptions?: string[]
  
  // Optional preferences
  language_preferred?: string[]
  communication_style?: string
  domicile_location?: string
}

interface PatientSignupFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    description: "Your account details",
  },
  {
    id: 2,
    title: "Personal Details",
    description: "Tell us about yourself",
  },
  {
    id: 3,
    title: "Medical History",
    description: "Help us understand your health",
  },
  {
    id: 4,
    title: "Preferences",
    description: "Customize your experience",
  },
]

export function PatientSignupForm({ onSuccess, onCancel }: PatientSignupFormProps) {
  const { signup } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState<PatientSignupData>({
    name: "",
    email: "",
    password: "",
    phone_no: "",
    dob: "",
    gender: "",
    city: "",
    last_hospital_visit: "",
    chronic_conditions: [],
    allergies: [],
    current_medications: [],
    past_prescriptions: [],
    language_preferred: [],
    communication_style: "",
    domicile_location: "",
  })

  const [arrayInputs, setArrayInputs] = useState({
    chronic_conditions: "",
    allergies: "",
    current_medications: "",
    past_prescriptions: "",
    language_preferred: "",
  })

  const updateField = (field: keyof PatientSignupData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const addArrayItem = (field: keyof PatientSignupData, value: string) => {
    if (!value.trim()) return
    const current = (formData[field] as string[]) || []
    if (!current.includes(value.trim())) {
      updateField(field, [...current, value.trim()])
    }
    setArrayInputs((prev) => ({ ...prev, [field]: "" }))
  }

  const removeArrayItem = (field: keyof PatientSignupData, index: number) => {
    const current = (formData[field] as string[]) || []
    updateField(field, current.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError("Name is required")
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
      // Clean up empty optional fields
      const submitData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }

      // Add optional fields only if they have values
      if (formData.phone_no?.trim()) submitData.phone_no = formData.phone_no.trim()
      if (formData.dob?.trim()) submitData.dob = formData.dob
      if (formData.gender?.trim()) submitData.gender = formData.gender.trim()
      if (formData.city?.trim()) submitData.city = formData.city.trim()
      if (formData.last_hospital_visit?.trim()) submitData.last_hospital_visit = formData.last_hospital_visit.trim()
      if (formData.communication_style?.trim()) submitData.communication_style = formData.communication_style.trim()
      if (formData.domicile_location?.trim()) submitData.domicile_location = formData.domicile_location.trim()

      // Add arrays only if they have items
      if (formData.chronic_conditions && formData.chronic_conditions.length > 0) {
        submitData.chronic_conditions = formData.chronic_conditions
      }
      if (formData.allergies && formData.allergies.length > 0) {
        submitData.allergies = formData.allergies
      }
      if (formData.current_medications && formData.current_medications.length > 0) {
        submitData.current_medications = formData.current_medications
      }
      if (formData.past_prescriptions && formData.past_prescriptions.length > 0) {
        submitData.past_prescriptions = formData.past_prescriptions
      }
      if (formData.language_preferred && formData.language_preferred.length > 0) {
        submitData.language_preferred = formData.language_preferred
      }

      await signup(submitData)
      onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || err.response?.data?.error || "Signup failed. Please try again.")
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
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
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
                placeholder="Enter your email"
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
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone_no || ""}
                onChange={(e) => updateField("phone_no", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Date of Birth
              </label>
              <Input
                type="date"
                value={formData.dob || ""}
                onChange={(e) => updateField("dob", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Gender
              </label>
              <select
                value={formData.gender || ""}
                onChange={(e) => updateField("gender", e.target.value)}
                className="w-full h-9 rounded-md border border-n-6 bg-n-9/40 backdrop-blur text-n-1 px-3 text-sm focus-visible:border-color-1 focus-visible:outline-none disabled:opacity-50"
                disabled={loading}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
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
                Last Hospital Visit
              </label>
              <Input
                type="text"
                placeholder="When was your last hospital visit?"
                value={formData.last_hospital_visit || ""}
                onChange={(e) => updateField("last_hospital_visit", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Chronic Conditions
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a condition (e.g., Diabetes)"
                  value={arrayInputs.chronic_conditions}
                  onChange={(e) => setArrayInputs((prev) => ({ ...prev, chronic_conditions: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("chronic_conditions", arrayInputs.chronic_conditions)
                    }
                  }}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("chronic_conditions", arrayInputs.chronic_conditions)}
                  variant="outline"
                  className="border-n-6 bg-n-9/40 text-n-1 hover:bg-n-8"
                  disabled={loading}
                >
                  Add
                </Button>
              </div>
              {formData.chronic_conditions && formData.chronic_conditions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.chronic_conditions.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-n-7 text-n-1 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("chronic_conditions", index)}
                        className="text-n-3 hover:text-n-1"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Allergies
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add an allergy (e.g., Penicillin)"
                  value={arrayInputs.allergies}
                  onChange={(e) => setArrayInputs((prev) => ({ ...prev, allergies: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("allergies", arrayInputs.allergies)
                    }
                  }}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("allergies", arrayInputs.allergies)}
                  variant="outline"
                  className="border-n-6 bg-n-9/40 text-n-1 hover:bg-n-8"
                  disabled={loading}
                >
                  Add
                </Button>
              </div>
              {formData.allergies && formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.allergies.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-n-7 text-n-1 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("allergies", index)}
                        className="text-n-3 hover:text-n-1"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Current Medications
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a medication"
                  value={arrayInputs.current_medications}
                  onChange={(e) => setArrayInputs((prev) => ({ ...prev, current_medications: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("current_medications", arrayInputs.current_medications)
                    }
                  }}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("current_medications", arrayInputs.current_medications)}
                  variant="outline"
                  className="border-n-6 bg-n-9/40 text-n-1 hover:bg-n-8"
                  disabled={loading}
                >
                  Add
                </Button>
              </div>
              {formData.current_medications && formData.current_medications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.current_medications.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-n-7 text-n-1 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("current_medications", index)}
                        className="text-n-3 hover:text-n-1"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Past Prescriptions
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a past prescription"
                  value={arrayInputs.past_prescriptions}
                  onChange={(e) => setArrayInputs((prev) => ({ ...prev, past_prescriptions: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("past_prescriptions", arrayInputs.past_prescriptions)
                    }
                  }}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("past_prescriptions", arrayInputs.past_prescriptions)}
                  variant="outline"
                  className="border-n-6 bg-n-9/40 text-n-1 hover:bg-n-8"
                  disabled={loading}
                >
                  Add
                </Button>
              </div>
              {formData.past_prescriptions && formData.past_prescriptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.past_prescriptions.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-n-7 text-n-1 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("past_prescriptions", index)}
                        className="text-n-3 hover:text-n-1"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Preferred Languages
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a language (e.g., English, Urdu)"
                  value={arrayInputs.language_preferred}
                  onChange={(e) => setArrayInputs((prev) => ({ ...prev, language_preferred: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("language_preferred", arrayInputs.language_preferred)
                    }
                  }}
                  className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("language_preferred", arrayInputs.language_preferred)}
                  variant="outline"
                  className="border-n-6 bg-n-9/40 text-n-1 hover:bg-n-8"
                  disabled={loading}
                >
                  Add
                </Button>
              </div>
              {formData.language_preferred && formData.language_preferred.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.language_preferred.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-n-7 text-n-1 text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeArrayItem("language_preferred", index)}
                        className="text-n-3 hover:text-n-1"
                        disabled={loading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Communication Style
              </label>
              <select
                value={formData.communication_style || ""}
                onChange={(e) => updateField("communication_style", e.target.value)}
                className="w-full h-9 rounded-md border border-n-6 bg-n-9/40 backdrop-blur text-n-1 px-3 text-sm focus-visible:border-color-1 focus-visible:outline-none disabled:opacity-50"
                disabled={loading}
              >
                <option value="">Select communication style</option>
                <option value="Formal">Formal</option>
                <option value="Casual">Casual</option>
                <option value="Friendly">Friendly</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-n-1">
                Domicile Location
              </label>
              <Input
                type="text"
                placeholder="Enter your domicile location"
                value={formData.domicile_location || ""}
                onChange={(e) => updateField("domicile_location", e.target.value)}
                className="border-n-6 bg-n-9/40 backdrop-blur text-n-1 placeholder:text-n-4 focus-visible:border-color-1"
                disabled={loading}
              />
            </div>
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
            <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
          </div>
          <CardTitle className="text-2xl text-n-1 mb-2">
            Create Your Account
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