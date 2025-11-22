import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cpifquoelejdrtlqycsj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaWZxdW9lbGVqZHJ0bHF5Y3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODM4NTEsImV4cCI6MjA3Nzc1OTg1MX0.9xJjAStrw9z28lg0GOrFneJs7ckJiYnmzdwS_gz581M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      );
    }

    // Get all completed appointments for the patient
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        status,
        chief_complaint,
        diagnosis,
        transcription,
        symptoms,
        prescription,
        lab_tests,
        vital_signs,
        examination_findings,
        follow_up_date,
        follow_up_notes,
        completed_at,
        doctors:doctor_id (
          id,
          name,
          specialization
        )
      `)
      .eq('patient_id', parseInt(patientId))
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

