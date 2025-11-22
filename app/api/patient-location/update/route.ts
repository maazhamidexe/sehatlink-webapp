import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://gpt-backend-gules.vercel.app"

export async function POST(req: NextRequest) {
  try {
    console.log("[Location Update] API called")
    const { token, latitude, longitude } = await req.json()
    console.log("[Location Update] Received - lat:", latitude, "lng:", longitude)

    if (!token || latitude === undefined || longitude === undefined) {
      console.log("[Location Update] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[Location Update] Decoding JWT token to get user_id")
    // Decode JWT token to get user_id directly (no backend call needed)
    let patientId: number
    try {
      // JWT tokens have 3 parts: header.payload.signature
      const tokenParts = token.split('.')
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format')
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      console.log("[Location Update] Token payload:", payload)
      
      // Get user_id from token payload
      patientId = parseInt(payload.user_id || payload.userId || payload.id)
      
      if (!patientId || isNaN(patientId)) {
        throw new Error('user_id not found in token')
      }
      
      console.log("[Location Update] Patient ID from token:", patientId)
    } catch (tokenError: any) {
      console.error("[Location Update] Token decode error:", tokenError.message)
      return NextResponse.json({ 
        error: "Failed to decode token", 
        details: tokenError.message 
      }, { status: 400 })
    }
    console.log("[Location Update] Patient ID:", patientId)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpifquoelejdrtlqycsj.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaWZxdW9lbGVqZHJ0bHF5Y3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODM4NTEsImV4cCI6MjA3Nzc1OTg1MX0.9xJjAStrw9z28lg0GOrFneJs7ckJiYnmzdwS_gz581M'

    console.log("[Location Update] Checking existing records in Supabase")
    // Check if record exists in patient_locations
    let checkResponse
    try {
      checkResponse = await axios.get(
        `${supabaseUrl}/rest/v1/patient_locations?patient_id=eq.${patientId}&select=*`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      )
    } catch (supabaseError: any) {
      console.error("[Location Update] Supabase check error:", supabaseError.response?.data || supabaseError.message)
      return NextResponse.json({ 
        error: "Failed to check existing location", 
        details: supabaseError.response?.data || supabaseError.message 
      }, { status: 500 })
    }

    const existingRecords = checkResponse.data
    console.log("[Location Update] Existing records found:", existingRecords.length)

    try {
      if (existingRecords.length === 0) {
        // Create new record in patient_locations
        console.log("[Location Update] Creating new location record")
        await axios.post(
          `${supabaseUrl}/rest/v1/patient_locations`,
          {
            patient_id: patientId,
            latitude,
            longitude,
          },
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
          }
        )
      } else {
        // Update existing record in patient_locations
        console.log("[Location Update] Updating existing location record")
        await axios.patch(
          `${supabaseUrl}/rest/v1/patient_locations?patient_id=eq.${patientId}`,
          {
            latitude,
            longitude,
          },
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
          }
        )
      }
    } catch (locationError: any) {
      console.error("[Location Update] Location save error:", locationError.response?.data || locationError.message)
      console.error("[Location Update] Full error:", JSON.stringify(locationError.response?.data, null, 2))
      return NextResponse.json({ 
        error: "Failed to save location", 
        details: locationError.response?.data || locationError.message,
        fullError: locationError.response?.data
      }, { status: 500 })
    }

    // Update loc_status in patients table to true
    console.log("[Location Update] Updating patient loc_status")
    try {
      await axios.patch(
        `${supabaseUrl}/rest/v1/patients?id=eq.${patientId}`,
        {
          loc_status: true,
        },
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
        }
      )
    } catch (statusError: any) {
      console.error("[Location Update] Status update error:", statusError.response?.data || statusError.message)
      console.error("[Location Update] Full status error:", JSON.stringify(statusError.response?.data, null, 2))
      // Don't fail the request if just the status update fails
      console.log("[Location Update] Location saved but status update failed")
    }

    console.log("[Location Update] Successfully updated location and loc_status")
    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
    })
  } catch (error: any) {
    console.error("[Location Update] Unexpected error:", error)
    console.error("[Location Update] Error stack:", error.stack)
    return NextResponse.json(
      { 
        error: error.message || "Failed to update location",
        details: error.response?.data || error.message,
        fullError: error.response?.data
      },
      { status: 500 }
    )
  }
}

