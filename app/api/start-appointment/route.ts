import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .eq('id', appointmentId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to start appointment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      data: data?.[0]
    })

  } catch (error) {
    console.error('Start appointment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

