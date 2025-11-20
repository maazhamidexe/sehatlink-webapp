"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface Appointment {
  id: string
  patient_name: string
  patient_email: string
  appointment_date: string
  appointment_time: string
  status: string
  reason?: string
  notes?: string
  created_at: string
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [doctorName, setDoctorName] = useState("")

  useEffect(() => {
    // Check if doctor is logged in
    const token = localStorage.getItem("doctor_token")
    const userType = localStorage.getItem("user_type")
    
    if (!token || userType !== "doctor") {
      router.push("/auth/doctor")
      return
    }

    fetchAppointments()
  }, [router])

  const fetchAppointments = async () => {
    setLoading(true)
    setError("")
    
    try {
      // Fetch all appointments from Supabase
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true })

      if (error) throw error

      setAppointments(data || [])
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
    router.push("/auth/doctor")
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    // Only navigate to appointment page for upcoming or confirmed appointments
    if (appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "pending") {
      router.push(`/appointment/${appointment.id}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    })
  }

  const formatTime = (timeString: string) => {
    // If timeString is already in HH:MM format
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":")
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? "PM" : "AM"
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    }
    return timeString
  }

  return (
    <div className="min-h-screen bg-n-8 text-n-1 font-sora">
      {/* Header */}
      <header className="border-b border-n-6 bg-n-7/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-conic-gradient">
              <svg className="w-6 h-6 text-n-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-n-1">Doctor Dashboard</h1>
              <p className="text-xs text-n-3">Manage your appointments</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-n-6 text-n-2 hover:bg-n-6 hover:text-n-1"
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-n-3">Total Appointments</p>
                    <p className="text-3xl font-bold text-n-1 mt-2">
                      {appointments.length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-color-1/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-color-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-n-3">Pending</p>
                    <p className="text-3xl font-bold text-n-1 mt-2">
                      {appointments.filter(a => a.status.toLowerCase() === "pending").length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-n-3">Confirmed</p>
                    <p className="text-3xl font-bold text-n-1 mt-2">
                      {appointments.filter(a => a.status.toLowerCase() === "confirmed").length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-n-1">All Appointments</CardTitle>
                <Button
                  onClick={fetchAppointments}
                  variant="outline"
                  size="sm"
                  className="border-n-6 text-n-2 hover:bg-n-6 hover:text-n-1"
                  disabled={loading}
                >
                  {loading ? "Refreshing..." : "Refresh"}
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
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleAppointmentClick(appointment)}
                      className={`border border-n-6 rounded-lg p-4 bg-n-8/30 transition-colors ${
                        (appointment.status.toLowerCase() === "confirmed" || appointment.status.toLowerCase() === "pending") 
                          ? "hover:bg-n-8/50 cursor-pointer hover:border-color-1" 
                          : "opacity-70"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-n-1 text-lg">
                              {appointment.patient_name}
                            </h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-n-3">
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {appointment.patient_email}
                            </p>
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}
                            </p>
                            {appointment.reason && (
                              <p className="flex items-start gap-2 mt-2">
                                <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-n-2">{appointment.reason}</span>
                              </p>
                            )}
                            {appointment.notes && (
                              <p className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-n-2 italic">{appointment.notes}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-n-4 md:text-right">
                          <p>Created:</p>
                          <p>{new Date(appointment.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
