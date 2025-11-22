"use client"

import { useEffect, useState, useRef } from "react"

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

interface Facility {
  name: string
  address: string
  rating?: number | string
  status: string
  map_link: string
  lat?: number
  lng?: number
}

interface FacilitiesMapProps {
  searchLocation: { lat: number; lng: number }
  facilities: Facility[]
  height?: string
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

export function FacilitiesMap({ searchLocation, facilities, height = "400px" }: FacilitiesMapProps) {
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)
  const [apiKey, setApiKey] = useState<string>("")

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    setApiKey(key)
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey || scriptLoadedRef.current) return

    if (window.google && window.google.maps && window.google.maps.Map) {
      setIsMapLoaded(true)
      scriptLoadedRef.current = true
      return
    }

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
      setIsMapLoaded(true)
      scriptLoadedRef.current = true
    }
    script.onerror = () => {
      console.error("Failed to load Google Maps script")
      setIsMapLoaded(false)
    }
    document.head.appendChild(script)
    scriptLoadedRef.current = true
  }, [apiKey])

  // Initialize map
  useEffect(() => {
    if (!isMapLoaded || map) return

    let retryCount = 0
    const maxRetries = 20

    const initMap = () => {
      if (!mapRef.current) {
        retryCount++
        if (retryCount < maxRetries) {
          setTimeout(initMap, 100)
          return
        }
        return
      }

      if (!window.google?.maps?.Map) {
        return
      }

      try {
        const mapOptions = {
          center: searchLocation,
          zoom: 13,
          styles: DARK_MAP_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        }

        const newMap = new window.google.maps.Map(mapRef.current, mapOptions)
        if (newMap) {
          setMap(newMap)
        }
      } catch (err: any) {
        console.error("Error initializing map:", err)
      }
    }

    const timer = setTimeout(initMap, 100)
    return () => clearTimeout(timer)
  }, [isMapLoaded, map, searchLocation])

  // Add markers to map
  useEffect(() => {
    if (!map || facilities.length === 0 || !window.google) return

    // Clear existing markers
    markers.forEach(marker => {
      marker.setMap(null)
    })
    setMarkers([])

    const newMarkers: any[] = []
    const infoWindows: any[] = []

    facilities.forEach((facility, index) => {
      // Extract lat/lng from map_link or use provided coordinates
      let lat = facility.lat
      let lng = facility.lng

      // If coordinates not provided, try to extract from map_link
      if (!lat || !lng) {
        const queryMatch = facility.map_link.match(/query=([^&]+)/)
        if (queryMatch) {
          const coords = queryMatch[1].split(',')
          if (coords.length === 2) {
            lat = parseFloat(coords[0])
            lng = parseFloat(coords[1])
          }
        }
      }

      // If still no coordinates, skip this facility
      if (!lat || !lng) {
        console.warn(`Skipping facility ${facility.name} - no coordinates available`)
        return
      }

      // Create custom marker icon (hospital icon - red cross)
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: "#ff4444",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        anchor: new window.google.maps.Point(0, 0),
      }

      const marker = new window.google.maps.Marker({
        map: map,
        position: { lat, lng },
        icon: markerIcon,
        title: facility.name,
      })

      // Format rating display
      const ratingDisplay = facility.rating === "N/A" || facility.rating === undefined || facility.rating === null
        ? "N/A"
        : typeof facility.rating === "number"
        ? facility.rating.toFixed(1)
        : facility.rating

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #e5e7eb; font-family: system-ui, sans-serif; padding: 12px; min-width: 250px; max-width: 300px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #f9fafb;">
              ${facility.name}
            </h3>
            <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">
              <strong>Address:</strong> ${facility.address}
            </p>
            <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">
              <strong>Rating:</strong> ${ratingDisplay}
            </p>
            <p style="margin: 4px 0; font-size: 14px; color: #d1d5db;">
              <strong>Status:</strong> <span style="color: ${facility.status === "OPERATIONAL" ? "#10b981" : "#ef4444"}">${facility.status}</span>
            </p>
            <a href="${facility.map_link}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #79fff7; color: #0a0a0a; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">
              View on Maps
            </a>
          </div>
        `,
      })

      // Add click listener
      marker.addListener("click", () => {
        infoWindows.forEach(iw => iw.close())
        infoWindow.open(map, marker)
      })

      newMarkers.push(marker)
      infoWindows.push(infoWindow)
    })

    setMarkers(newMarkers)

    // Fit bounds to show all markers and search location
    if (newMarkers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      bounds.extend(searchLocation)
      facilities.forEach((facility) => {
        let lat = facility.lat
        let lng = facility.lng
        if (!lat || !lng) {
          const queryMatch = facility.map_link.match(/query=([^&]+)/)
          if (queryMatch) {
            const coords = queryMatch[1].split(',')
            if (coords.length === 2) {
              lat = parseFloat(coords[0])
              lng = parseFloat(coords[1])
            }
          }
        }
        if (lat && lng) {
          bounds.extend({ lat, lng })
        }
      })
      map.fitBounds(bounds)
    } else {
      // If no facilities, center on search location
      map.setCenter(searchLocation)
      map.setZoom(13)
    }
  }, [map, facilities, searchLocation])

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-n-4">Google Maps API key not configured</p>
      </div>
    )
  }

  if (!isMapLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-color-1 border-r-transparent mb-4"></div>
          <p className="text-n-3">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-n-6" style={{ height }}>
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#000000"
        }}
      />
      {!map && isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-n-8/50 pointer-events-none">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-color-1 border-r-transparent mb-4"></div>
            <p className="text-n-3">Initializing map...</p>
          </div>
        </div>
      )}
    </div>
  )
}

