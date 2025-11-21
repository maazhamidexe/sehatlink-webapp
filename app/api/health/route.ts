import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
  
  return NextResponse.json({
    status: 'ok',
    backendUrl: backendUrl,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    message: 'Frontend is working. Check if backend URL is correct.'
  })
}

