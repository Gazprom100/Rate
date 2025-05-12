import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const response = await fetch('https://api.decimalchain.com/api/v1/coins', {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying Decimal API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from Decimal API' },
      { status: 500 }
    );
  }
} 