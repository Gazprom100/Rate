import { NextRequest, NextResponse } from 'next/server';

// Переключаемся на стандартный рантайм
// export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    console.log('Starting fetch request to Decimal API...');
    
    // Получаем параметры пагинации из запроса
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';
    
    console.log(`Fetching coins with limit=${limit}, offset=${offset}`);
    
    const url = new URL('https://api.decimalchain.com/api/v1/coins');
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rate-App/1.0',
      },
      next: { revalidate: 60 }, // Кешируем на 60 секунд
    });

    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;
      console.error(`API request failed: ${status} ${statusText}`);
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
    if (data.ok && Array.isArray(data.result)) {
      console.log(`Successfully retrieved ${data.result.length} tokens from API`);
      return NextResponse.json(data.result);
    } else if (Array.isArray(data)) {
      console.log(`API returned array directly with ${data.length} tokens`);
      return NextResponse.json(data);
    } else {
      console.log('API returned response in unexpected format:', typeof data);
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error proxying Decimal API:', error.name, error.message, error.stack);
    
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