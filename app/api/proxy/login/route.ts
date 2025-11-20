import { NextRequest, NextResponse } from 'next/server'
import { serverAxios } from '@/lib/axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await serverAxios.post('/patient/login', {
      email: body.email,
      password: body.password,
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Login proxy error:', error)
    return NextResponse.json(
      { 
        error: error.response?.data?.detail || error.message || 'Login failed',
        detail: error.response?.data?.detail 
      },
      { status: error.response?.status || 500 }
    )
  }
}

