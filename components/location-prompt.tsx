"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"

interface LocationPromptProps {
  onLocationGranted: (latitude: number, longitude: number) => Promise<void>
  onSkip?: () => void
}

export function LocationPrompt({ onLocationGranted, onSkip }: LocationPromptProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setLoading(true)
    setError("")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await onLocationGranted(position.coords.latitude, position.coords.longitude)
        } catch (err: any) {
          setError(err.message || "Failed to save location")
          setLoading(false)
        }
      },
      (error) => {
        setLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError("Location permission denied. Please enable location access.")
            break
          case error.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.")
            break
          case error.TIMEOUT:
            setError("Location request timed out.")
            break
          default:
            setError("An unknown error occurred.")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className="border-n-6 bg-n-7/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-conic-gradient">
                <MapPin className="h-8 w-8 text-n-8" />
              </div>
              <CardTitle className="text-2xl text-n-1">
                Enable Location Access
              </CardTitle>
              <p className="text-sm text-n-3">
                We need your location to provide better healthcare services, 
                find nearby hospitals, and track disease outbreaks in your area.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-color-3/50 bg-color-3/10 p-3 text-sm text-color-3"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleGetLocation}
                  disabled={loading}
                  className="w-full bg-conic-gradient text-n-8 hover:opacity-90 font-code font-bold uppercase tracking-wider"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Allow Location Access
                    </>
                  )}
                </Button>

                {onSkip && (
                  <Button
                    onClick={onSkip}
                    variant="outline"
                    disabled={loading}
                    className="w-full border-n-6 bg-transparent text-n-3 hover:bg-n-6/50 hover:text-n-1"
                  >
                    Skip for Now
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-n-4">
                  Your location data is secure and will only be used for healthcare purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

