import { NextRequest, NextResponse } from 'next/server'
import { serverAxios } from '@/lib/axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await serverAxios.post('/patient/signup', {
      email: body.email,
      password: body.password,
      name: body.name,
      phone_no: body.phone_no || null,
      dob: body.dob || null,
      gender: body.gender || null,
      city: body.city || null,
      last_hospital_visit: body.last_hospital_visit || null,
      chronic_conditions: body.chronic_conditions || null,
      allergies: body.allergies || null,
      current_medications: body.current_medications || null,
      past_prescriptions: body.past_prescriptions || null,
      language_preferred: body.language_preferred || null,
      communication_style: body.communication_style || null,
      domicile_location: body.domicile_location || null,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Signup proxy error:', error)
    return NextResponse.json(
      { 
        error: error.response?.data?.detail || error.message || 'Signup failed',
        detail: error.response?.data?.detail 
      },
      { status: error.response?.status || 500 }
    )
  }
}

