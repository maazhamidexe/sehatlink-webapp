import { NextRequest, NextResponse } from 'next/server'
import { serverAxios } from '@/lib/axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      )
    }

    console.log('Attempting to start chat session...')
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
    console.log('Backend URL:', backendUrl)
    console.log('Full endpoint:', `${backendUrl}/patient/chat-start`)
    console.log('Authorization header present:', !!authHeader)
    
    const response = await serverAxios.get('/patient/chat-start', {
      headers: {
        Authorization: authHeader,
      },
    })

    console.log('Chat session started successfully')
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(response.data, null, 2))
    console.log('Response data keys:', Object.keys(response.data || {}))
    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('Chat-start proxy error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
      }
    })
    
    // Log the full response if available
    if (error.response) {
      console.error('Backend response status:', error.response.status)
      console.error('Backend response data:', JSON.stringify(error.response.data, null, 2))
      console.error('Backend response headers:', error.response.headers)
    } else if (error.request) {
      console.error('No response received from backend. Request config:', error.config)
      console.error('This might indicate the backend is not running or unreachable')
    }
    
    // Provide more detailed error information
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.error || 
                        error.response?.data?.message ||
                        error.message || 
                        'Failed to start chat'
    const statusCode = error.response?.status || 500
    
    return NextResponse.json(
      { 
        error: errorMessage,
        detail: error.response?.data?.detail || error.message,
        message: error.response?.data?.message,
        code: error.code,
        endpoint: '/patient/chat-start',
        backendError: error.response?.data, // Include full backend error
      },
      { status: statusCode }
    )
  }
}

