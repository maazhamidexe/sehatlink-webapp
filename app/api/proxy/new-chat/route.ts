import { NextRequest, NextResponse } from 'next/server'
import { serverAxios } from '@/lib/axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    const response = await serverAxios.post('/user/new-chat', {}, {
      headers: {
        Authorization: authHeader,
      },
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('New-chat proxy error:', error)
    return NextResponse.json(
      { 
        error: error.response?.data?.detail || error.message || 'Failed to start new chat',
        detail: error.response?.data?.detail 
      },
      { status: error.response?.status || 500 }
    )
  }
}

