import { NextRequest, NextResponse } from 'next/server';

// Принудительно указываем, что это динамический маршрут
export const dynamic = 'force-dynamic';

// Переключаемся на стандартный рантайм
// export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting fetch request to Decimal API History...');
    
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');
    const timeFrame = searchParams.get('timeFrame');

    if (!tokenId) {
      console.error('Missing required parameter: tokenId');
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: 'Token ID is required',
          statusCode: 400
        }, 
        { status: 400 }
      );
    }

    console.log(`Fetching history for token ${tokenId} with timeFrame: ${timeFrame || 'default'}`);
    
    // Конструируем URL с правильным форматом согласно документации Swagger
    // URL должен быть: /api/v1/coins/{symbol}
    const baseUrl = 'https://api.decimalchain.com/api/v1/coins';
    const apiUrl = `${baseUrl}/${tokenId}`;
    
    // Создаем URL объект для добавления параметров запроса
    const url = new URL(apiUrl);
    if (timeFrame) {
      url.searchParams.append('timeFrame', timeFrame);
    }
    
    console.log(`Sending request to: ${url.toString()}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rate-App/1.0',
      },
      // Кешируем на короткое время
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;
      console.error(`History API request failed: ${status} ${statusText}`);
      return NextResponse.json(
        { 
          error: 'Decimal API Error',
          message: `API returned error: ${status} ${statusText}`,
          statusCode: status
        },
        { status }
      );
    }

    const data = await response.json();
    
    // Обрабатываем различные форматы ответов
    if (data.ok && data.result) {
      console.log('Successfully retrieved token history data');
      return NextResponse.json(data.result);
    } else {
      console.log('Token history data returned in unexpected format');
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error proxying Decimal API history:', error.name, error.message, error.stack);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error.message,
        statusCode: 500
      },
      { status: 500 }
    );
  }
} 