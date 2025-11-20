import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      appointmentId,
      transcription,
      chief_complaint,
      symptoms,
      diagnosis,
      prescription,
      lab_tests,
      vital_signs,
      examination_findings,
      follow_up_date,
      follow_up_notes
    } = await request.json()

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        transcription,
        chief_complaint,
        symptoms,
        diagnosis,
        prescription,
        lab_tests,
        vital_signs,
        examination_findings,
        follow_up_date,
        follow_up_notes,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', appointmentId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save appointment data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      data: data?.[0]
    })

  } catch (error) {
    console.error('Save appointment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

