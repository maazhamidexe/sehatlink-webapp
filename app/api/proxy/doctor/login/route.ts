import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== DOCTOR LOGIN ATTEMPT ===');
    console.log('Backend URL:', API_BASE_URL);
    console.log('Full endpoint:', `${API_BASE_URL}/doctor/login`);
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Environment:', process.env.NODE_ENV);
    
    const response = await fetch(`${API_BASE_URL}/doctor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // For Node.js 18+ fetch, we can't disable SSL verification directly
      // If you need to disable SSL, set NODE_TLS_REJECT_UNAUTHORIZED=0 in environment
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 500));
      return NextResponse.json(
        { 
          detail: `Backend returned non-JSON response. Status: ${response.status}. Content-Type: ${contentType}. This usually means the endpoint doesn't exist or there's a server error.`,
          status: response.status,
          endpoint: `${API_BASE_URL}/doctor/login`,
          backendUrl: API_BASE_URL,
          responsePreview: text.substring(0, 200)
        },
        { status: 502 }
      );
    }
    
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Backend returned error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('Login successful!');
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('=== ERROR IN DOCTOR LOGIN PROXY ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error cause:', error.cause);
    console.error('Error stack:', error.stack);
    console.error('API_BASE_URL:', API_BASE_URL);
    
    return NextResponse.json(
      { 
        detail: `Failed to connect to authentication service: ${error.message}`,
        endpoint: `${API_BASE_URL}/doctor/login`,
        backendUrl: API_BASE_URL,
        errorType: error.name,
        suggestion: 'Please verify the backend API is running and accessible. Check NEXT_PUBLIC_API_URL environment variable in Vercel settings.',
        envSet: !!process.env.NEXT_PUBLIC_API_URL
      },
      { status: 500 }
    );
  }
}
