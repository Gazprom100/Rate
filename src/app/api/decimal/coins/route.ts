import { NextRequest, NextResponse } from 'next/server';

// Принудительно указываем, что это динамический маршрут
export const dynamic = 'force-dynamic';

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
    
    // Исправляем URL API в соответствии с документацией Swagger
    // basePath: "/api/v1/coins" означает, что полный путь должен быть:
    // https://api.decimalchain.com/api/v1/coins/coins
    const url = new URL('https://api.decimalchain.com/api/v1/coins/coins');
    url.searchParams.append('limit', limit);
    url.searchParams.append('offset', offset);
    
    console.log(`Sending request to: ${url.toString()}`);
    
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
    console.log('Raw API response:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Правильно обрабатываем вложенную структуру ответа API
    if (data.Ok === true && Array.isArray(data.Result) && data.Result.length > 0) {
      const coinsData = data.Result[0].coins;
      if (Array.isArray(coinsData)) {
        console.log(`Successfully retrieved ${coinsData.length} tokens from API`);
        
        // Нормализуем ключи к ожидаемому формату
        const normalizedCoins = coinsData.map(coin => ({
          id: coin.symbol,
          symbol: coin.symbol,
          name: coin.title,
          price: parseFloat(coin.price || 0),
          reserve: parseFloat(coin.reserve || 0),
          crr: parseFloat(coin.crr || 0),
          wallets_count: parseInt(coin.wallets_count || 0),
          delegation_percentage: parseFloat(coin.delegation_percentage || 0),
        }));
        
        return NextResponse.json(normalizedCoins);
      }
    }
    
    // Если формат не соответствует ожидаемому
    console.error('Unexpected API response format:', data);
    return NextResponse.json(
      { 
        error: 'API Format Error',
        message: 'Unexpected data format from Decimal API',
        statusCode: 500
      },
      { status: 500 }
    );
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