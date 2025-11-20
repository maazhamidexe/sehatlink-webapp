import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://34.42.175.232';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching hospitals from:', `${API_BASE_URL}/hospitals/list`);
    
    const response = await fetch(`${API_BASE_URL}/hospitals/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching hospitals list:', error);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { detail: `Failed to fetch hospitals list: ${error.message}` },
      { status: 500 }
    );
  }
}
