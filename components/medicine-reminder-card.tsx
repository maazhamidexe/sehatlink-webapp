"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Pill, CheckCircle2, Circle, X, Clock, Check, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface Medicine {
  id: number
  name: string
  dose: string
  frequency: string
  duration: string
}

interface MedicineWithStatus extends Medicine {
  taken?: boolean
  notTaken?: boolean
  lateTaken?: string | null
}

const USER_ID = 1 // Hardcoded user_id

export function MedicineReminderCard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [medicines, setMedicines] = useState<MedicineWithStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyMedicines, setSurveyMedicines] = useState<Medicine[]>([])
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0)
  const [surveyLoading, setSurveyLoading] = useState(false)
  const [surveyComplete, setSurveyComplete] = useState(false)

  useEffect(() => {
    if (selectedDate) {
      fetchMedicinesForDate(selectedDate)
    } else {
      setMedicines([])
    }
  }, [selectedDate])

  const fetchMedicinesForDate = async (date: Date) => {
    setLoading(true)
    try {
      const dateString = date.toISOString().split('T')[0]
      
      // First, try to fetch from daily_routine for the selected date
      const { data: dailyRoutineData, error: routineError } = await supabase
        .from('daily_routine')
        .select(`
          *,
          medicine_data (
            id,
            name,
            dose,
            frequency,
            duration
          )
        `)
        .eq('date_filled', dateString)
        .eq('user_id', USER_ID)

      if (routineError || !dailyRoutineData || dailyRoutineData.length === 0) {
        // If no daily_routine data, fetch all medicines from medicine_data
        const { data: medicineData, error: medicineError } = await supabase
          .from('medicine_data')
          .select('*')
          .eq('user_id', USER_ID)

        if (medicineError) {
          console.error('Error fetching medicines:', medicineError)
          setMedicines([])
        } else {
          setMedicines(medicineData || [])
        }
      } else {
        // Map the joined data from daily_routine
        const mappedMedicines = dailyRoutineData
          .filter((routine: any) => routine.medicine_data) // Filter out null medicine_data
          .map((routine: any) => ({
            ...routine.medicine_data,
            taken: routine.taken,
            notTaken: routine.not_taken,
            lateTaken: routine.late_taken,
          }))
        setMedicines(mappedMedicines)
      }
    } catch (error) {
      console.error('Error fetching medicines:', error)
      setMedicines([])
    } finally {
      setLoading(false)
    }
  }

  const initiateSurvey = async () => {
    if (!selectedDate) return

    setSurveyLoading(true)
    try {
      const dateString = selectedDate.toISOString().split('T')[0]
      
      // Fetch all medicines for the user
      const { data: medicineData, error: medicineError } = await supabase
        .from('medicine_data')
        .select('*')
        .eq('user_id', USER_ID)

      if (medicineError) {
        console.error('Error fetching medicines for survey:', medicineError)
        setSurveyLoading(false)
        return
      }

      // Check which medicines already have entries for today
      const { data: existingRoutines } = await supabase
        .from('daily_routine')
        .select('medicine_id')
        .eq('date_filled', dateString)
        .eq('user_id', USER_ID)

      const existingMedicineIds = new Set((existingRoutines || []).map((r: any) => r.medicine_id))
      
      // Filter out medicines that already have entries
      const medicinesToSurvey = (medicineData || []).filter(
        (med: Medicine) => !existingMedicineIds.has(med.id)
      )

      if (medicinesToSurvey.length === 0) {
        alert('All medicines for today have already been recorded!')
        setSurveyLoading(false)
        return
      }

      setSurveyMedicines(medicinesToSurvey)
      setCurrentSurveyIndex(0)
      setSurveyComplete(false)
      setShowSurvey(true)
    } catch (error) {
      console.error('Error initiating survey:', error)
    } finally {
      setSurveyLoading(false)
    }
  }

  const handleSurveyResponse = async (response: 'taken' | 'not_taken' | 'late') => {
    if (currentSurveyIndex >= surveyMedicines.length) return

    setSurveyLoading(true)
    try {
      const currentMedicine = surveyMedicines[currentSurveyIndex]
      const dateString = selectedDate!.toISOString().split('T')[0]
      const currentTime = new Date().toTimeString().split(' ')[0] // HH:MM:SS format

      let insertData: any = {
        user_id: USER_ID,
        medicine_id: currentMedicine.id,
        date_filled: dateString,
      }

      if (response === 'taken') {
        insertData.taken = true
        insertData.not_taken = false
        insertData.late_taken = null
      } else if (response === 'not_taken') {
        insertData.taken = false
        insertData.not_taken = true
        insertData.late_taken = null
      } else if (response === 'late') {
        insertData.taken = false
        insertData.not_taken = false
        insertData.late_taken = currentTime
      }

      const { error } = await supabase
        .from('daily_routine')
        .insert([insertData])

      if (error) {
        console.error('Error inserting survey response:', error)
        alert('Error saving response. Please try again.')
        setSurveyLoading(false)
        return
      }

      // Move to next medicine
      if (currentSurveyIndex < surveyMedicines.length - 1) {
        setCurrentSurveyIndex(currentSurveyIndex + 1)
      } else {
        // Survey complete
        setSurveyComplete(true)
        // Refresh medicines to show updated status
        await fetchMedicinesForDate(selectedDate!)
      }
    } catch (error) {
      console.error('Error handling survey response:', error)
      alert('Error saving response. Please try again.')
    } finally {
      setSurveyLoading(false)
    }
  }

  const closeSurvey = () => {
    setShowSurvey(false)
    setSurveyMedicines([])
    setCurrentSurveyIndex(0)
    setSurveyComplete(false)
    if (selectedDate) {
      fetchMedicinesForDate(selectedDate)
    }
  }

  const isToday = selectedDate && 
    selectedDate.toDateString() === new Date().toDateString()

  return (
    <>
      <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-n-1">
            <Calendar className="h-3 w-3 text-n-2" />
            Medicine Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border-0 bg-transparent"
            />

            {/* Survey Button - Only show for today */}
            {isToday && medicines.length > 0 && (
              <Button
                onClick={initiateSurvey}
                disabled={surveyLoading}
                className="w-full bg-conic-gradient text-n-8 hover:opacity-90 font-code font-bold uppercase tracking-wider"
              >
                {surveyLoading ? 'Loading...' : 'Initiate Survey for Today'}
              </Button>
            )}

            {/* Medicine Card - Shows when a date is selected */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-n-6 bg-n-9/40 backdrop-blur p-4"
              >
                <h3 className="mb-4 text-sm font-semibold text-n-1">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>

                {loading ? (
                  <div className="text-center py-4">
                    <span className="text-sm text-n-2">Loading medicines...</span>
                  </div>
                ) : medicines.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-n-6 bg-n-9/40 backdrop-blur p-6 text-center">
                    <Pill className="mx-auto h-8 w-8 text-n-2" />
                    <p className="mt-2 text-sm text-n-2">
                      No medicines scheduled for this day
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medicines.map((medicine, index) => (
                      <motion.div
                        key={medicine.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 rounded-lg border border-n-6 bg-n-9/40 backdrop-blur p-4"
                      >
                        <div className="mt-0.5">
                          {medicine.taken ? (
                            <CheckCircle2 className="h-5 w-5 text-color-4" />
                          ) : (
                            <Circle className="h-5 w-5 text-n-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-n-1">
                                {medicine.name}
                              </h4>
                              <div className="mt-2 space-y-1 text-sm text-n-2">
                                <p>
                                  <span className="font-medium">Frequency:</span> {medicine.frequency || 'N/A'}
                                </p>
                                <p>
                                  <span className="font-medium">Duration:</span> {medicine.duration || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {medicine.taken && (
                                <Badge className="bg-color-4 text-n-8 text-xs px-2 py-0.5">
                                  {medicine.lateTaken ? 'Taken Late' : 'Taken'}
                                </Badge>
                              )}
                              {medicine.notTaken && (
                                <Badge className="bg-color-3 text-n-1 text-xs px-2 py-0.5">Missed</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Survey Modal */}
      <AnimatePresence>
        {showSurvey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={surveyComplete ? closeSurvey : undefined}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-xl border border-n-6 bg-n-7/90 backdrop-blur-sm shadow-lg p-6"
            >
              {surveyComplete ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-color-4/10">
                    <CheckCircle2 className="h-8 w-8 text-color-4" />
                  </div>
                  <h2 className="mb-2 text-xl font-semibold text-n-1">
                    Survey Complete!
                  </h2>
                  <p className="mb-6 text-sm text-n-2">
                    All medicines have been recorded for today.
                  </p>
                  <Button
                    onClick={closeSurvey}
                    className="w-full bg-conic-gradient text-n-8 hover:opacity-90 font-code font-bold uppercase tracking-wider"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-n-1">
                        Medicine Survey
                      </h2>
                      <p className="mt-1 text-sm text-n-2">
                        {currentSurveyIndex + 1} of {surveyMedicines.length}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={closeSurvey}
                      className="text-n-2 hover:text-n-1 hover:bg-n-9/40"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {surveyMedicines[currentSurveyIndex] && (
                    <div className="space-y-6">
                      <div className="rounded-lg border border-n-6 bg-n-9/40 backdrop-blur p-4">
                        <h3 className="mb-2 text-lg font-semibold text-n-1">
                          {surveyMedicines[currentSurveyIndex].name}
                        </h3>
                        <div className="space-y-1 text-sm text-n-2">
                          <p>
                            <span className="font-medium">Dose:</span> {surveyMedicines[currentSurveyIndex].dose || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Frequency:</span> {surveyMedicines[currentSurveyIndex].frequency || 'N/A'}
                          </p>
                          <p>
                            <span className="font-medium">Duration:</span> {surveyMedicines[currentSurveyIndex].duration || 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-n-1">
                          Did you take this medicine?
                        </p>
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleSurveyResponse('taken')}
                            disabled={surveyLoading}
                            className="w-full justify-start bg-color-4 text-n-8 hover:bg-color-4/90"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Taken on Time
                          </Button>
                          <Button
                            onClick={() => handleSurveyResponse('not_taken')}
                            disabled={surveyLoading}
                            className="w-full justify-start bg-color-3 text-n-1 hover:bg-color-3/90"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Not Taken
                          </Button>
                          <Button
                            onClick={() => handleSurveyResponse('late')}
                            disabled={surveyLoading}
                            className="w-full justify-start border-color-2 text-color-2 hover:bg-color-2/10 bg-n-9/40"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Taken Late
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
