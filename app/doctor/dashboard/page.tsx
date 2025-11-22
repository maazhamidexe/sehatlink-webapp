"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { DiseaseMap } from "@/components/disease-map"
import { FileText, X, Stethoscope, UserCircle } from "lucide-react"

interface Appointment {
  id: number
  doctor_id: number
  patient_id: number
  appointment_time: string
  appointment_date?: string | null
  status: string | null
  notes?: string | null
  transcription?: string | null
  chief_complaint?: string | null
  symptoms?: any
  diagnosis?: string | null
  prescription?: any
  lab_tests?: any
  vital_signs?: any
  examination_findings?: string | null
  follow_up_date?: string | null
  follow_up_notes?: string | null
  started_at?: string | null
  completed_at?: string | null
  patient_name?: string
  patient_email?: string
}

interface Doctor {
  id: number
  name: string
  email: string
  specialization: string | null
  city: string | null
  experience_years: number | null
  licence_no: string
  affiliation_type: string | null
  hospital_id: number | null
  clinic_address: string | null
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("doctor_token")
    const userType = localStorage.getItem("user_type")
    
    if (!token || userType !== "doctor") {
      router.push("/auth/doctor")
      return
    }

    fetchDoctorInfo()
    fetchAppointments()
  }, [router])

  const fetchDoctorInfo = async () => {
    try {
      let doctorId = localStorage.getItem("doctor_id")
      
      if (!doctorId) {
        const token = localStorage.getItem("doctor_token")
        if (token) {
          try {
            const axios = (await import("axios")).default
            try {
              const doctorResponse = await axios.get("/api/proxy/doctor/me", {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              })
              
              if (doctorResponse.data.id || doctorResponse.data.doctor_id) {
                const id = (doctorResponse.data.id || doctorResponse.data.doctor_id).toString()
                doctorId = id
                localStorage.setItem("doctor_id", id)
              }
            } catch (apiError: any) {
              const email = localStorage.getItem("doctor_email")
              if (email) {
                const { data: doctorData, error: doctorError } = await supabase
                  .from("doctors")
                  .select("id")
                  .eq("email", email)
                  .single()
                
                if (!doctorError && doctorData) {
                  const id = doctorData.id.toString()
                  doctorId = id
                  localStorage.setItem("doctor_id", id)
                }
              }
            }
          } catch (err) {
            console.error("Error getting doctor_id:", err)
          }
        }
      }
      
      if (doctorId) {
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("*")
          .eq("id", parseInt(doctorId))
          .single()

        if (!doctorError && doctorData) {
          setDoctor(doctorData as Doctor)
        }
      }
    } catch (err: any) {
      console.error("Error fetching doctor info:", err)
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    setError("")
    
    try {
      let doctorId = localStorage.getItem("doctor_id")
      
      if (!doctorId) {
        const token = localStorage.getItem("doctor_token")
        if (token) {
          try {
            const axios = (await import("axios")).default
            try {
              const doctorResponse = await axios.get("/api/proxy/doctor/me", {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              })
              
              if (doctorResponse.data.id || doctorResponse.data.doctor_id) {
                const id = (doctorResponse.data.id || doctorResponse.data.doctor_id).toString()
                doctorId = id
                localStorage.setItem("doctor_id", id)
              }
            } catch (apiError: any) {
              const email = localStorage.getItem("doctor_email")
              if (email) {
                const { data: doctorData, error: doctorError } = await supabase
                  .from("doctors")
                  .select("id")
                  .eq("email", email)
                  .single()
                
                if (!doctorError && doctorData) {
                  const id = doctorData.id.toString()
                  doctorId = id
                  localStorage.setItem("doctor_id", id)
                }
              }
            }
          } catch (err) {
            console.error("Error getting doctor_id:", err)
          }
        }
      }
      
      if (!doctorId) {
        setError("Doctor ID not found. Please login again.")
        setLoading(false)
        return
      }

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", parseInt(doctorId))
        .order("appointment_time", { ascending: true })

      if (appointmentsError) throw appointmentsError

      const patientIds = [...new Set((appointmentsData || []).map((apt: any) => apt.patient_id).filter(Boolean))]

      let patientsMap: Record<number, { name: string; email: string }> = {}
      if (patientIds.length > 0) {
        const { data: patientsData, error: patientsError } = await supabase
          .from("patients")
          .select("id, name, email")
          .in("id", patientIds)

        if (!patientsError && patientsData) {
          patientsData.forEach((patient: any) => {
            patientsMap[patient.id] = {
              name: patient.name,
              email: patient.email
            }
          })
        }
      }

      const transformedData = (appointmentsData || []).map((appointment: any) => ({
        ...appointment,
        patient_name: appointment.patient_id ? (patientsMap[appointment.patient_id]?.name || "Unknown Patient") : "Unknown Patient",
        patient_email: appointment.patient_id ? (patientsMap[appointment.patient_id]?.email || "N/A") : "N/A"
      }))

      setAppointments(transformedData)
    } catch (err: any) {
      console.error("Error fetching appointments:", err)
      setError(err.message || "Failed to fetch appointments")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("doctor_token")
    localStorage.removeItem("user_type")
    localStorage.removeItem("doctor_id")
    localStorage.removeItem("doctor_email")
    router.push("/auth/doctor")
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    const status = appointment.status?.toLowerCase() || ""
    if (status === "completed") {
      // Show details modal for completed appointments
      setSelectedAppointment(appointment)
      setIsAppointmentModalOpen(true)
    } else if (status === "confirmed" || status === "pending" || status === "scheduled" || status === "in_progress") {
      // Navigate to appointment page for active appointments
      router.push(`/appointment/${appointment.id}`)
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Date not set"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return "Invalid date"
      return date.toLocaleDateString("en-US", { 
        weekday: "short", 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
      })
    } catch {
      return "Invalid date"
    }
  }

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "Time not set"
    try {
      // If it's just a time string (HH:MM:SS), format it directly
      if (timeStr.match(/^\d{2}:\d{2}(:\d{2})?(\.\d+)?$/)) {
        const [hours, minutes] = timeStr.split(':')
        const hour = parseInt(hours, 10)
        const minute = parseInt(minutes, 10)
        const date = new Date()
        date.setHours(hour, minute, 0, 0)
        return date.toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit",
          hour12: true
        })
      }
      // If it's a full timestamp, parse it
      const date = new Date(timeStr)
      if (isNaN(date.getTime())) return "Invalid time"
      return date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true
      })
    } catch {
      return "Invalid time"
    }
  }

  const formatDateTime = (appointment: Appointment) => {
    const dateStr = appointment.appointment_date
    const timeStr = appointment.appointment_time
    const completedAt = appointment.completed_at
    
    // Try to combine appointment_date and appointment_time
    if (dateStr && timeStr) {
      try {
        const date = new Date(dateStr)
        const timeParts = timeStr.split(':')
        if (timeParts.length >= 2) {
          const hours = parseInt(timeParts[0], 10)
          const minutes = parseInt(timeParts[1], 10)
          const seconds = timeParts[2] ? parseInt(timeParts[2].split('.')[0], 10) : 0
          
          if (!isNaN(hours) && !isNaN(minutes)) {
            date.setHours(hours, minutes, seconds, 0)
            if (!isNaN(date.getTime())) {
              return date.toLocaleString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
              })
            }
          }
        }
      } catch (e) {
        console.error("Error formatting datetime:", e)
      }
    }
    
    // Fallback 1: Use completed_at if available and no appointment_date
    if (!dateStr && completedAt) {
      try {
        const date = new Date(completedAt)
        if (!isNaN(date.getTime())) {
          return date.toLocaleString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })
        }
      } catch (e) {
        console.error("Error formatting completed_at:", e)
      }
    }
    
    // Fallback 2: Show date and time separately
    const datePart = dateStr ? formatDate(dateStr) : (completedAt ? formatDate(completedAt) : "Date not set")
    const timePart = timeStr ? formatTime(timeStr) : "Time not set"
    return `${datePart} at ${timePart}`
  }


  const pendingCount = appointments.filter(a => a.status?.toLowerCase() === "pending" || a.status?.toLowerCase() === "scheduled").length
  const confirmedCount = appointments.filter(a => a.status?.toLowerCase() === "confirmed" || a.status?.toLowerCase() === "completed").length
  const todayAppointments = appointments.filter(a => {
    const aptDate = new Date(a.appointment_time)
    const today = new Date()
    return aptDate.toDateString() === today.toDateString()
  }).length

  return (
    <div className="min-h-screen bg-n-8 text-n-1 font-sora">
      {/* Modern Header */}
      <header className="border-b border-n-6 bg-n-7/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src="/sehat-link-logo.svg" width={32} height={32} alt="Sehat Link" />
              <h1 className="text-xl font-bold text-n-1">Sehat Link</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="border-n-6 text-n-2 hover:bg-n-6 hover:text-n-1"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile & Stats */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Doctor Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center mb-4">
                    <div className="h-24 w-24 rounded-full bg-n-8 border-4 border-n-6 mb-3 flex items-center justify-center">
                      <Stethoscope className="h-12 w-12 text-n-1" strokeWidth={2} />
                    </div>
                    <h2 className="text-xl font-bold text-n-1 text-center">
                      {doctor?.name || "Dr. Loading..."}
                    </h2>
                    {doctor?.specialization && (
                      <p className="text-sm text-color-1 font-medium mt-1">
                        {doctor.specialization}
                      </p>
                    )}
                    <Badge className="mt-2 bg-n-6 text-n-2 border-n-5">
                      License: {doctor?.licence_no || "N/A"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-n-6">
                    {doctor?.email && (
                      <div className="flex items-center gap-2 text-sm text-n-3">
                        <svg className="w-4 h-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    )}
                    {doctor?.city && (
                      <div className="flex items-center gap-2 text-sm text-n-3">
                        <svg className="w-4 h-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{doctor.city}</span>
                      </div>
                    )}
                    {doctor?.experience_years && (
                      <div className="flex items-center gap-2 text-sm text-n-3">
                        <svg className="w-4 h-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{doctor.experience_years} years experience</span>
                      </div>
                    )}
                    {doctor?.affiliation_type && (
                      <div className="flex items-center gap-2 text-sm text-n-3">
                        <svg className="w-4 h-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="capitalize">{doctor.affiliation_type}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-3"
            >
              <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-n-3 uppercase tracking-wide">Today</p>
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-n-1">{todayAppointments}</p>
                  <p className="text-xs text-n-4 mt-1">appointments today</p>
                </CardContent>
              </Card>

              <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-n-3 uppercase tracking-wide">Pending</p>
                    <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-n-1">{pendingCount}</p>
                  <p className="text-xs text-n-4 mt-1">awaiting confirmation</p>
                </CardContent>
              </Card>

              <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-n-3 uppercase tracking-wide">Total</p>
                    <div className="h-8 w-8 rounded-full bg-color-1/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-color-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-n-1">{appointments.length}</p>
                  <p className="text-xs text-n-4 mt-1">all appointments</p>
                </CardContent>
              </Card>
            </motion.div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
            {/* Appointments Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl text-n-1">Appointments</CardTitle>
                      <p className="text-sm text-n-3 mt-1">Manage and view all patient appointments</p>
                    </div>
                    <Button
                      onClick={fetchAppointments}
                      variant="outline"
                      size="sm"
                      className="border-n-6 text-n-2 hover:bg-n-6 hover:text-n-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-n-3 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-color-1 border-r-transparent"></div>
                      <p className="mt-4 text-n-3">Loading appointments...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-color-3">{error}</p>
                      <Button
                        onClick={fetchAppointments}
                        className="mt-4 bg-conic-gradient text-n-8 hover:opacity-90"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-n-4 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-n-3">No appointments found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map((appointment) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleAppointmentClick(appointment)}
                          className={`border border-n-6 rounded-lg p-4 bg-n-8/30 transition-all ${
                            (appointment.status?.toLowerCase() === "confirmed" || appointment.status?.toLowerCase() === "pending" || appointment.status?.toLowerCase() === "scheduled" || appointment.status?.toLowerCase() === "in_progress" || appointment.status?.toLowerCase() === "completed") 
                              ? "hover:bg-n-8/50 cursor-pointer hover:border-color-1 hover:shadow-lg hover:shadow-color-1/10" 
                              : "opacity-70"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-n-7 flex items-center justify-center border border-n-6">
                                  <span className="text-n-2 font-semibold text-sm">
                                    {appointment.patient_name?.charAt(0) || "?"}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-n-1">
                                    {appointment.patient_name}
                                  </h3>
                                  <p className="text-xs text-n-4">{appointment.patient_email}</p>
                                </div>
                                <Badge className={getStatusColor(appointment.status)}>
                                  {appointment.status || "Unknown"}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-n-3 ml-13">
                                <p className="flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDateTime(appointment)}
                                </p>
                                {appointment.chief_complaint && (
                                  <p className="flex items-start gap-2 mt-2">
                                    <svg className="w-4 h-4 mt-0.5 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-n-2"><strong>Complaint:</strong> {appointment.chief_complaint}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-n-4 md:text-right">
                              <p className="font-medium">ID: {appointment.id}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Disease Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <DiseaseMap />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Appointment Details Modal */}
      <AnimatePresence>
        {isAppointmentModalOpen && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAppointmentModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-n-6 bg-n-8 shadow-2xl"
            >
              <Card className="border-0 bg-transparent">
                <CardHeader className="border-b border-n-6 bg-n-7/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2 text-n-1">
                      <FileText className="h-5 w-5" />
                      Appointment Details
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAppointmentModalOpen(false)}
                      className="text-n-4 hover:text-n-1"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  <ScrollArea className="h-full">
                    <div className="space-y-6">
                      {/* Patient Information */}
                      <div>
                        <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Patient Information</h3>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-n-1">
                            {selectedAppointment.patient_name || "N/A"}
                          </p>
                          {selectedAppointment.patient_email && (
                            <p className="text-sm text-n-4">{selectedAppointment.patient_email}</p>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-n-6" />

                      {/* Appointment Date & Time */}
                      <div>
                        <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Date & Time</h3>
                        <div className="space-y-1">
                          {selectedAppointment.appointment_date && (
                            <p className="text-sm text-n-1">
                              Date: {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          {selectedAppointment.appointment_time && (
                            <p className="text-sm text-n-1">
                              {selectedAppointment.appointment_date 
                                ? `Time: ${selectedAppointment.appointment_time}`
                                : formatDateTime(selectedAppointment)
                              }
                            </p>
                          )}
                          {selectedAppointment.completed_at && (
                            <p className="text-xs text-n-4 mt-1">
                              Completed: {new Date(selectedAppointment.completed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-n-6" />

                      {/* Chief Complaint */}
                      {selectedAppointment.chief_complaint && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Chief Complaint</h3>
                            <p className="text-sm text-n-1 leading-relaxed">{selectedAppointment.chief_complaint}</p>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Symptoms */}
                      {selectedAppointment.symptoms && Array.isArray(selectedAppointment.symptoms) && selectedAppointment.symptoms.length > 0 && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Symptoms</h3>
                            <div className="space-y-2">
                              {selectedAppointment.symptoms.map((symptom: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-n-6 bg-n-9/40">
                                  <p className="text-sm font-medium text-n-1">{symptom.name || `Symptom ${index + 1}`}</p>
                                  {symptom.severity && (
                                    <p className="text-xs text-n-4 mt-1">Severity: {symptom.severity}</p>
                                  )}
                                  {symptom.duration && (
                                    <p className="text-xs text-n-4">Duration: {symptom.duration}</p>
                                  )}
                                  {symptom.notes && (
                                    <p className="text-xs text-n-3 mt-1">{symptom.notes}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Diagnosis */}
                      {selectedAppointment.diagnosis && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Diagnosis</h3>
                            <p className="text-sm text-n-1 leading-relaxed">{selectedAppointment.diagnosis}</p>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Examination Findings */}
                      {selectedAppointment.examination_findings && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Examination Findings</h3>
                            <p className="text-sm text-n-1 leading-relaxed">{selectedAppointment.examination_findings}</p>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Vital Signs */}
                      {selectedAppointment.vital_signs && typeof selectedAppointment.vital_signs === 'object' && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Vital Signs</h3>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedAppointment.vital_signs.blood_pressure && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">Blood Pressure</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.blood_pressure}</p>
                                </div>
                              )}
                              {selectedAppointment.vital_signs.heart_rate && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">Heart Rate</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.heart_rate}</p>
                                </div>
                              )}
                              {selectedAppointment.vital_signs.temperature && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">Temperature</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.temperature}</p>
                                </div>
                              )}
                              {selectedAppointment.vital_signs.weight && (
                                <div className="p-2 rounded border border-n-6 bg-n-9/40">
                                  <p className="text-xs text-n-4">Weight</p>
                                  <p className="text-sm text-n-1">{selectedAppointment.vital_signs.weight}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Prescription */}
                      {selectedAppointment.prescription && Array.isArray(selectedAppointment.prescription) && selectedAppointment.prescription.length > 0 && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Prescription</h3>
                            <div className="space-y-2">
                              {selectedAppointment.prescription.map((med: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-n-6 bg-n-9/40">
                                  <p className="text-sm font-medium text-n-1">{med.medication || `Medication ${index + 1}`}</p>
                                  <div className="mt-2 space-y-1">
                                    {med.dosage && (
                                      <p className="text-xs text-n-4">Dosage: {med.dosage}</p>
                                    )}
                                    {med.frequency && (
                                      <p className="text-xs text-n-4">Frequency: {med.frequency}</p>
                                    )}
                                    {med.duration && (
                                      <p className="text-xs text-n-4">Duration: {med.duration}</p>
                                    )}
                                    {med.instructions && (
                                      <p className="text-xs text-n-3 mt-1">{med.instructions}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Lab Tests */}
                      {selectedAppointment.lab_tests && Array.isArray(selectedAppointment.lab_tests) && selectedAppointment.lab_tests.length > 0 && (
                        <>
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Lab Tests</h3>
                            <div className="space-y-2">
                              {selectedAppointment.lab_tests.map((test: any, index: number) => (
                                <div key={index} className="p-3 rounded-lg border border-n-6 bg-n-9/40">
                                  <p className="text-sm font-medium text-n-1">{test.test_name || `Test ${index + 1}`}</p>
                                  {test.reason && (
                                    <p className="text-xs text-n-4 mt-1">Reason: {test.reason}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <Separator className="bg-n-6" />
                        </>
                      )}

                      {/* Follow-up */}
                      {(selectedAppointment.follow_up_date || selectedAppointment.follow_up_notes) && (
                        <div>
                          <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Follow-up</h3>
                          <div className="space-y-1">
                            {selectedAppointment.follow_up_date && (
                              <p className="text-sm text-n-1">
                                Date: {new Date(selectedAppointment.follow_up_date).toLocaleDateString()}
                              </p>
                            )}
                            {selectedAppointment.follow_up_notes && (
                              <p className="text-sm text-n-1 leading-relaxed mt-2">{selectedAppointment.follow_up_notes}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Transcription */}
                      {selectedAppointment.transcription && (
                        <>
                          <Separator className="bg-n-6" />
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Transcription</h3>
                            <p className="text-sm text-n-2 leading-relaxed whitespace-pre-wrap">{selectedAppointment.transcription}</p>
                          </div>
                        </>
                      )}

                      {/* Notes */}
                      {selectedAppointment.notes && (
                        <>
                          <Separator className="bg-n-6" />
                          <div>
                            <h3 className="text-sm font-semibold text-n-3 mb-2 uppercase tracking-wide">Notes</h3>
                            <p className="text-sm text-n-2 leading-relaxed whitespace-pre-wrap">{selectedAppointment.notes}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
