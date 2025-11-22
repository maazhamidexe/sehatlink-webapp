import { NextRequest, NextResponse } from "next/server"
import axios from "axios"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://gpt-backend-gules.vercel.app"

export async function POST(req: NextRequest) {
  try {
    console.log("[Location Check] API called")
    const { token } = await req.json()

    if (!token) {
      console.log("[Location Check] No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Location Check] Decoding JWT token to get user_id")
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
      console.log("[Location Check] Token payload:", payload)
      
      // Get user_id from token payload
      patientId = parseInt(payload.user_id || payload.userId || payload.id)
      
      if (!patientId || isNaN(patientId)) {
        throw new Error('user_id not found in token')
      }
      
      console.log("[Location Check] Patient ID from token:", patientId)
    } catch (tokenError: any) {
      console.error("[Location Check] Token decode error:", tokenError.message)
      return NextResponse.json(
        { 
          error: "Failed to decode token",
          details: tokenError.message
        },
        { status: 400 }
      )
    }
    console.log("[Location Check] Patient ID:", patientId)

    // Check loc_status from patients table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpifquoelejdrtlqycsj.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaWZxdW9lbGVqZHJ0bHF5Y3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODM4NTEsImV4cCI6MjA3Nzc1OTg1MX0.9xJjAStrw9z28lg0GOrFneJs7ckJiYnmzdwS_gz581M'

    console.log("[Location Check] Checking loc_status from patients table")
    try {
      const patientResponse = await axios.get(
        `${supabaseUrl}/rest/v1/patients?id=eq.${patientId}&select=loc_status`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      )

      const patientData = patientResponse.data

      if (patientData.length === 0) {
        console.log("[Location Check] Patient not found, asking for location")
        return NextResponse.json({
          needsLocation: true,
          patientId,
        })
      }

      const patient = patientData[0]
      console.log("[Location Check] Patient loc_status:", patient.loc_status)

      if (!patient.loc_status) {
        // loc_status is false, need to ask for location
        console.log("[Location Check] loc_status is false, returning needsLocation: true")
        return NextResponse.json({
          needsLocation: true,
          patientId,
        })
      }

      // loc_status is true, location already set
      console.log("[Location Check] loc_status is true, location already set")
      return NextResponse.json({
        needsLocation: false,
        patientId,
      })
    } catch (supabaseError: any) {
      console.error("[Location Check] Supabase error:", supabaseError.response?.data || supabaseError.message)
      // If check fails, ask for location to be safe
      return NextResponse.json({
        needsLocation: true,
        patientId,
      })
    }
  } catch (error: any) {
    console.error("[Location Check] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check location" },
      { status: 500 }
    )
  }
}

