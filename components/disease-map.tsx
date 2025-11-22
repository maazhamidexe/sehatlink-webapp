"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

interface DiseaseReport {
  id: number
  disease_type: string
  city: string
  latitude: number
  longitude: number
  severity_level?: string
  report_date?: string
  has_coordinates: boolean
}

// Color mapping for different disease types (using hex colors for markers)
const DISEASE_COLORS: Record<string, string> = {
  dengue: "#FF0000",
  denguefever: "#FF0000",
  malaria: "#0000FF",
  typhoid: "#00FF00",
  hepatitis: "#FFFF00",
  tuberculosis: "#800080",
  tb: "#800080",
  covid19: "#FFA500",
  covid: "#FFA500",
  flu: "#00FFFF",
  influenza: "#00FFFF",
  cholera: "#A52A2A",
  measles: "#FFC0CB",
  hypertension: "#00008B",
  diabetes: "#008080",
  asthma: "#ADD8E6",
  default: "#808080"
}

// Function to get color for a disease type
const getDiseaseColor = (diseaseType: string): string => {
  const normalizedType = diseaseType.toLowerCase().replace(/[\s_-]/g, "")
  return DISEASE_COLORS[normalizedType] || DISEASE_COLORS.default
}

// Function to get severity badge color
const getSeverityColor = (severity?: string): string => {
  if (!severity) return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  
  const normalized = severity.toLowerCase()
  switch (normalized) {
    case "critical":
    case "severe":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "moderate":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case "mild":
      return "bg-green-500/20 text-green-400 border-green-500/30"
    default:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
  }
}

// Pakistan center coordinates
const PAKISTAN_CENTER = {
  lat: 30.3753,
  lng: 69.3451
}

// Custom black/dark theme for Google Maps
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#999999" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#999999" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0a0a0a" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#000000" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#888888" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2a2a2a" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#000000" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#aaaaaa" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#999999" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a0a0a" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#555555" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#000000" }]
  }
]

export function DiseaseMap() {
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  // Get API key from environment (client-side)
  const [apiKey, setApiKey] = useState<string>("")

  useEffect(() => {
    // Get API key from environment variable (client-side)
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    setApiKey(key)
    if (!key) {
      console.warn("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set")
      setError("Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local")
    }
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey || scriptLoadedRef.current) return

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.Map) {
      console.log("Google Maps already loaded")
      setIsMapLoaded(true)
      scriptLoadedRef.current = true
      return
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        setIsMapLoaded(true)
        scriptLoadedRef.current = true
      })
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log("Google Maps script loaded successfully")
      setIsMapLoaded(true)
      scriptLoadedRef.current = true
    }
    script.onerror = () => {
      console.error("Failed to load Google Maps script")
      setError("Failed to load Google Maps. Please check your API key.")
      setIsMapLoaded(false)
    }
    document.head.appendChild(script)
    scriptLoadedRef.current = true
  }, [apiKey])

  useEffect(() => {
    fetchDiseaseReports()
  }, [])

  // Initialize map when Google Maps is loaded and container is ready
  useEffect(() => {
    if (!isMapLoaded || map) return
    
    let retryCount = 0
    const maxRetries = 20
    
    const initMap = () => {
      if (!mapRef.current) {
        retryCount++
        if (retryCount < maxRetries) {
          console.log(`Map container not ready, retrying... (${retryCount}/${maxRetries})`)
          setTimeout(initMap, 100)
          return
        } else {
          console.error("Map container not available after max retries")
          setError("Map container is not available. Please refresh the page.")
          return
        }
      }
      
      if (!window.google?.maps?.Map) {
        console.error("Google Maps API not available", {
          hasGoogle: !!window.google,
          hasMaps: !!(window.google?.maps),
          hasMap: !!(window.google?.maps?.Map)
        })
        setError("Google Maps API is not available. Please check your API key.")
        return
      }

      try {
        console.log("Initializing Google Maps with container:", {
          element: mapRef.current,
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        })
        
        const mapOptions = {
          center: PAKISTAN_CENTER,
          zoom: 6,
          styles: DARK_MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        }
        
        const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
        
        // Verify map was created
        if (newMap) {
          console.log("Map initialized successfully", newMap)
          setMap(newMap)
        } else {
          console.error("Map initialization returned null/undefined")
          setError("Map initialization failed. Please check the console.")
        }
      } catch (err: any) {
        console.error("Error initializing map:", err)
        setError(`Failed to initialize map: ${err.message || "Unknown error"}`)
      }
    }

    // Start initialization with a small delay
    const timer = setTimeout(initMap, 100)
    return () => clearTimeout(timer)
  }, [isMapLoaded, map])

  // Add markers to map
  useEffect(() => {
    if (map && diseaseReports.length > 0 && window.google) {
      // Clear existing markers
      markers.forEach(marker => {
        marker.setMap(null)
      })
      setMarkers([])

      // Create new markers
      const newMarkers: any[] = []
      const infoWindows: any[] = []

      diseaseReports.forEach((report) => {
        if (report.latitude && report.longitude && report.has_coordinates) {
          const color = getDiseaseColor(report.disease_type)
          
          // Create custom marker icon (circular dot)
          const markerIcon = {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            anchor: new window.google.maps.Point(0, 0),
          }

          const marker = new window.google.maps.Marker({
            map: map,
            position: { lat: report.latitude, lng: report.longitude },
            icon: markerIcon,
            title: `${report.disease_type} - ${report.city} (${report.severity_level || "Unknown"})`,
          })

          // Create info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="color: #e5e7eb; font-family: system-ui, sans-serif; padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #f9fafb;">
                  ${report.disease_type}
                </h3>
                <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">
                  <strong>City:</strong> ${report.city}
                </p>
                <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">
                  <strong>Severity:</strong> ${report.severity_level || "Unknown"}
                </p>
                ${report.report_date ? `
                  <p style="margin: 4px 0; font-size: 12px; color: #9ca3af;">
                    ${new Date(report.report_date).toLocaleDateString()}
                  </p>
                ` : ""}
              </div>
            `,
          })

          // Add click listener
          marker.addListener("click", () => {
            // Close all other info windows
            infoWindows.forEach(iw => iw.close())
            infoWindow.open(map, marker)
          })

          newMarkers.push(marker)
          infoWindows.push(infoWindow)
        }
      })

      setMarkers(newMarkers)

      // Fit bounds to show all markers
      if (newMarkers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds()
        diseaseReports.forEach((report) => {
          if (report.has_coordinates) {
            bounds.extend({ lat: report.latitude, lng: report.longitude })
          }
        })
        map.fitBounds(bounds)
        
        // Adjust zoom if too zoomed out
        const listener = window.google.maps.event.addListener(map, "bounds_changed", () => {
          if (map.getZoom() && map.getZoom()! > 7) {
            map.setZoom(7)
          }
          window.google.maps.event.removeListener(listener)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, diseaseReports])

  const fetchDiseaseReports = async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/disease-reports")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch disease reports")
      }

      setDiseaseReports(result.data || [])
    } catch (err: any) {
      console.error("Error fetching disease reports:", err)
      setError(err.message || "Failed to load disease data")
    } finally {
      setLoading(false)
    }
  }

  // Group diseases by type for statistics
  const diseaseStats = diseaseReports.reduce((acc, report) => {
    const type = report.disease_type
    if (!acc[type]) {
      acc[type] = { 
        count: 0, 
        cities: new Set<string>(),
        criticalCount: 0,
        severeCount: 0,
        moderateCount: 0,
        mildCount: 0
      }
    }
    acc[type].count += 1
    acc[type].cities.add(report.city)
    
    // Count by severity
    const severity = report.severity_level?.toLowerCase()
    if (severity === "critical") acc[type].criticalCount += 1
    else if (severity === "severe") acc[type].severeCount += 1
    else if (severity === "moderate") acc[type].moderateCount += 1
    else if (severity === "mild") acc[type].mildCount += 1
    
    return acc
  }, {} as Record<string, { 
    count: number
    cities: Set<string>
    criticalCount: number
    severeCount: number
    moderateCount: number
    mildCount: number
  }>)

  return (
    <Card className="border-n-6 bg-n-7/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <CardTitle className="text-xl text-n-1">Disease Distribution Map</CardTitle>
            <p className="text-sm text-n-3 mt-1">Real-time disease tracking across Pakistan</p>
          </div>
          <div className="flex gap-2 items-center">
            <Badge className="bg-color-1/20 text-color-1 border-color-1/30">
              {diseaseReports.length} Reports
            </Badge>
            <button
              onClick={fetchDiseaseReports}
              disabled={loading}
              className="px-3 py-1 text-xs border border-n-6 rounded-lg hover:bg-n-6 text-n-2 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-color-1 border-r-transparent"></div>
            <p className="mt-4 text-n-3">Loading disease map...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-n-4 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-color-3 mb-2">{error}</p>
            <button
              onClick={fetchDiseaseReports}
              className="px-4 py-2 bg-conic-gradient text-n-8 rounded-lg hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Interactive Map Display */}
            <div className="rounded-lg overflow-hidden border border-n-6 bg-n-8 relative">
              {/* Debug info (remove in production) */}
              {process.env.NODE_ENV === "development" && (
                <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs p-2 rounded">
                  <div>API Key: {apiKey ? "✓ Set" : "✗ Missing"}</div>
                  <div>Map Loaded: {isMapLoaded ? "✓" : "✗"}</div>
                  <div>Map Instance: {map ? "✓" : "✗"}</div>
                  <div>Reports: {diseaseReports.length}</div>
                </div>
              )}
              {error && error.includes("Google Maps") ? (
                <div className="w-full h-[600px] flex items-center justify-center text-n-3">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-color-3 mb-2">Failed to load Google Maps</p>
                    <p className="text-xs text-n-4">Please check your API key configuration</p>
                  </div>
                </div>
              ) : !isMapLoaded ? (
                <div className="w-full h-[600px] flex items-center justify-center text-n-3">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-color-1 border-r-transparent mb-4"></div>
                    <p>Loading map...</p>
                  </div>
                </div>
              ) : !apiKey ? (
                <div className="w-full h-[600px] flex items-center justify-center text-n-3">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-n-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="mb-2">Google Maps API key not configured</p>
                    <p className="text-xs text-n-4">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full" style={{ height: "600px", minHeight: "600px" }}>
                  {/* Always render the map container so ref is available */}
                  <div 
                    ref={mapRef} 
                    className="w-full h-full rounded-lg"
                    style={{ 
                      width: "100%",
                      height: "100%",
                      minHeight: "600px",
                      backgroundColor: "#000000"
                    }}
                  />
                  {!map && isMapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-n-8/50 rounded-lg pointer-events-none">
                      <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-color-1 border-r-transparent mb-4"></div>
                        <p className="text-n-3">Initializing map...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Disease Legend & Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-n-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Disease Types & Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(diseaseStats).map(([diseaseType, stats]) => {
                  const color = getDiseaseColor(diseaseType)
                  return (
                    <div
                      key={diseaseType}
                      className="flex items-start gap-3 p-4 rounded-lg border border-n-6 bg-n-8/30 hover:bg-n-8/50 transition-colors"
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1"
                        style={{
                          backgroundColor: color,
                          borderColor: color
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-n-1 capitalize truncate">
                          {diseaseType}
                        </p>
                        <p className="text-xs text-n-3 mt-1">
                          {stats.count} {stats.count === 1 ? 'case' : 'cases'} • {stats.cities.size} {stats.cities.size === 1 ? 'city' : 'cities'}
                        </p>
                        {(stats.criticalCount > 0 || stats.severeCount > 0) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {stats.criticalCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                                {stats.criticalCount} Critical
                              </span>
                            )}
                            {stats.severeCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                {stats.severeCount} Severe
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {diseaseReports.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-n-4 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-n-3">No disease reports found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
