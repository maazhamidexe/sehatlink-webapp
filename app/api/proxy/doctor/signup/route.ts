import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Attempting doctor signup to:', `${API_BASE_URL}/doctor/signup`);
    
    const response = await fetch(`${API_BASE_URL}/doctor/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in doctor signup proxy:', error);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { detail: `Failed to connect to authentication service: ${error.message}` },
      { status: 500 }
    );
  }
}
