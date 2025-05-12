import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const timeFrame = searchParams.get('timeFrame');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    const apiUrl = `https://api.decimalchain.com/api/v1/coins/${tokenId}/history`;
    const url = timeFrame ? `${apiUrl}?timeFrame=${timeFrame}` : apiUrl;

    const response = await fetch(url, {
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
    console.error('Error proxying Decimal API history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token history from Decimal API' },
      { status: 500 }
    );
  }
} 