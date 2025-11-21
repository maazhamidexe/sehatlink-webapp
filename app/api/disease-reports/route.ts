import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Map of major Pakistani cities to their coordinates
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  karachi: { lat: 24.8607, lng: 67.0011 },
  lahore: { lat: 31.5204, lng: 74.3587 },
  islamabad: { lat: 33.6844, lng: 73.0479 },
  rawalpindi: { lat: 33.5651, lng: 73.0169 },
  faisalabad: { lat: 31.4180, lng: 73.0790 },
  multan: { lat: 30.1575, lng: 71.5249 },
  peshawar: { lat: 34.0151, lng: 71.5249 },
  quetta: { lat: 30.1798, lng: 66.9750 },
  sialkot: { lat: 32.4945, lng: 74.5229 },
  gujranwala: { lat: 32.1617, lng: 74.1883 },
  hyderabad: { lat: 25.3960, lng: 68.3578 },
  bahawalpur: { lat: 29.3956, lng: 71.6722 },
  sargodha: { lat: 32.0836, lng: 72.6711 },
  sukkur: { lat: 27.7058, lng: 68.8574 },
  larkana: { lat: 27.5590, lng: 68.2144 },
  sheikhupura: { lat: 31.7167, lng: 73.9850 },
  jhang: { lat: 31.2681, lng: 72.3181 },
  rahim_yar_khan: { lat: 28.4202, lng: 70.2952 },
  mardan: { lat: 34.1958, lng: 72.0447 },
  kasur: { lat: 31.1177, lng: 74.4497 },
  mingora: { lat: 34.7790, lng: 72.3604 },
  dera_ghazi_khan: { lat: 30.0561, lng: 70.6403 },
  sahiwal: { lat: 30.6704, lng: 73.1068 },
  nawabshah: { lat: 26.2442, lng: 68.4100 },
  okara: { lat: 30.8081, lng: 73.4596 },
  gilgit: { lat: 35.9208, lng: 74.3144 },
  chiniot: { lat: 31.7292, lng: 72.9783 },
  sadiqabad: { lat: 28.3089, lng: 70.1261 },
  burewala: { lat: 30.1667, lng: 72.6500 },
  jacobabad: { lat: 28.2769, lng: 68.4514 },
  jhelum: { lat: 32.9425, lng: 73.7257 },
  khanpur: { lat: 28.6472, lng: 70.6567 },
  hafizabad: { lat: 32.0707, lng: 73.6878 },
  muzaffargarh: { lat: 30.0703, lng: 71.1933 },
  kohat: { lat: 33.5869, lng: 71.4414 },
}

function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  const normalized = cityName.toLowerCase().trim().replace(/[.\s-]/g, "_")
  return CITY_COORDINATES[normalized] || null
}

export async function GET(request: NextRequest) {
  try {
    // Fetch disease reports from Supabase
    const { data: diseaseReports, error } = await supabase
      .from("disease_reports")
      .select("*")
      .order("report_date", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch disease reports", details: error.message },
        { status: 500 }
      )
    }

    // Transform data to include coordinates
    const transformedData = (diseaseReports || []).map((report: any) => {
      const coords = getCityCoordinates(report.reported_city || "")
      return {
        id: report.id,
        disease_type: report.disease_name,
        city: report.reported_city,
        latitude: coords?.lat || 0,
        longitude: coords?.lng || 0,
        severity_level: report.severity_level,
        report_date: report.report_date,
        has_coordinates: !!coords,
      }
    }).filter((report: any) => report.has_coordinates) // Only include reports with valid coordinates

    return NextResponse.json({ 
      success: true, 
      data: transformedData,
      total: transformedData.length
    })
  } catch (error: any) {
    console.error("Error fetching disease reports:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
