import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://34.42.175.232';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Attempting doctor login to:', `${API_BASE_URL}/doctor/login`);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
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
          endpoint: `${API_BASE_URL}/doctor/login`
        },
        { status: 502 }
      );
    }
    
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in doctor login proxy:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        detail: `Failed to connect to authentication service: ${error.message}`,
        endpoint: `${API_BASE_URL}/doctor/login`,
        suggestion: 'Please verify the backend API is running and the endpoint exists'
      },
      { status: 500 }
    );
  }
}
