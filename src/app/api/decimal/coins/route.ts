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
        
        // Логируем для отладки первый токен
        if (coinsData.length > 0) {
          console.log('Sample coin data before conversion:', {
            symbol: coinsData[0].symbol,
            price: coinsData[0].price,
            reserve: coinsData[0].reserve
          });
        }
        
        // Нормализуем ключи к ожидаемому формату и применяем преобразование
        const normalizedCoins = coinsData.map(coin => {
          const price = convertFromDecimals(coin.price || 0);
          const reserve = convertFromDecimals(coin.reserve || 0);
          
          return {
            id: coin.symbol,
            symbol: coin.symbol,
            name: coin.title,
            price: price,
            reserve: reserve,
            crr: parseFloat(coin.crr || 0),
            wallets_count: parseInt(coin.wallets_count || 0),
            delegation_percentage: parseFloat(coin.delegation_percentage || 0),
            // Оригинальные значения для отладки
            raw_price: coin.price,
            raw_reserve: coin.reserve
          };
        });
        
        // Логируем для отладки первый преобразованный токен
        if (normalizedCoins.length > 0) {
          console.log('Sample coin data after conversion:', {
            symbol: normalizedCoins[0].symbol,
            price: normalizedCoins[0].price,
            raw_price: normalizedCoins[0].raw_price,
            reserve: normalizedCoins[0].reserve,
            raw_reserve: normalizedCoins[0].raw_reserve
          });
        }
        
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