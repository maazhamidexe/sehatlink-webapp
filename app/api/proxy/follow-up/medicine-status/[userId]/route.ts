import { NextRequest, NextResponse } from 'next/server'
import { serverAxios } from '@/lib/axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{
    userId?: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header is required' }, { status: 401 })
    }

    const { userId } = await params
    console.log('User ID from params:', userId)
    if (!userId) {
      return NextResponse.json({ error: 'Valid user_id path parameter is required' }, { status: 400 })
    }

    const response = await serverAxios.get(`/follow-up/medicine-status/${userId}`, {
      headers: {
        Authorization: authHeader,
      },
    })

    return NextResponse.json(response.data, { status: 200 })
  } catch (error: any) {
    console.error('Medicine status proxy error:', error)

    const statusCode = error.response?.status || 500
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      'Failed to fetch medicine status notifications'

    return NextResponse.json(
      {
        error: detail,
        detail,
      },
      { status: statusCode }
    )
  }
}


