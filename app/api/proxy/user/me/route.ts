import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://gpt-backend-gules.vercel.app';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    console.log('Fetching user info from:', `${BACKEND_URL}/api/user/me`);
    
    const response = await fetch(`${BACKEND_URL}/api/user/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response received:', text.substring(0, 500));
      return NextResponse.json(
        { 
          detail: `Backend returned non-JSON response. Status: ${response.status}.`,
          status: response.status,
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
    console.error('Error in user me proxy:', error);
    return NextResponse.json(
      { 
        detail: `Failed to fetch user info: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

