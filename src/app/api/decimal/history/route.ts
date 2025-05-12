import { NextRequest, NextResponse } from 'next/server';

// Принудительно указываем, что это динамический маршрут
export const dynamic = 'force-dynamic';

// Переключаемся на стандартный рантайм
// export const runtime = 'edge';

// Функция для преобразования значений с учетом сдвига на 18 знаков
const convertFromDecimals = (value: string | number): number => {
  if (!value) return 0;
  
  const numValue = typeof value === 'string' ? value : value.toString();
  
  try {
    // Простое преобразование через деление на 10^18
    // Это работает лучше для больших чисел блокчейна
    return parseFloat(numValue) / 1000000000000000000; // 10^18
  } catch (e) {
    console.error('Error converting from decimals:', e);
    return 0;
  }
};

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
    console.log('Raw token history API response:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Обрабатываем различные форматы ответов
    if (data.Ok === true && data.Result) {
      console.log('Successfully retrieved token history data');
      
      // Преобразуем числовые значения в истории цен
      if (data.Result.price_history && Array.isArray(data.Result.price_history)) {
        console.log('Sample price history before conversion:', 
          data.Result.price_history.length > 0 ? data.Result.price_history[0] : 'No history');
          
        data.Result.price_history = data.Result.price_history.map((item: any) => ({
          ...item,
          raw_price: item.price, // Сохраняем оригинальное значение для отладки
          price: convertFromDecimals(item.price)
        }));
        
        console.log('Sample price history after conversion:', 
          data.Result.price_history.length > 0 ? data.Result.price_history[0] : 'No history');
      }
      
      return NextResponse.json(data.Result);
    } else {
      console.log('Token history data returned in unexpected format');
      return NextResponse.json(
        { 
          error: 'API Format Error',
          message: 'Unexpected token history format from Decimal API',
          statusCode: 500
        },
        { status: 500 }
      );
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