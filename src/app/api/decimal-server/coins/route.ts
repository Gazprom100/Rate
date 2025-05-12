import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Принудительно указываем, что это динамический маршрут
export const dynamic = 'force-dynamic';

// Не используем Edge Runtime для этого обработчика
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

export async function GET(request: NextRequest) {
  console.log('Starting server-side fetch to Decimal API...');
  
  try {
    // Получаем параметры пагинации из запроса
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';  // Значение по умолчанию из документации
    const offset = searchParams.get('offset') || '0'; // Значение по умолчанию из документации
    
    console.log(`Fetching coins with limit=${limit}, offset=${offset}`);
    
    // Исправляем URL API в соответствии с документацией Swagger
    const apiUrl = 'https://api.decimalchain.com/api/v1/coins/coins';
    console.log(`Sending request to: ${apiUrl}`);
    
    // Используем axios вместо fetch с добавлением параметров пагинации
    const response = await axios.get(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Rate-App/1.0',
      },
      params: {
        limit,
        offset
      },
      timeout: 10000, // 10 секунд таймаут
    });
    
    // Получаем данные из ответа
    const data = response.data;
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
    console.error('Server-side API error:', error.name);
    
    if (error.response) {
      // Ошибка от API с ответом (400, 500 и т.д.)
      console.error(`API responded with status ${error.response.status}:`, error.response.data);
      
      // Форматируем ответ в соответствии со структурой ResponseError из документации
      return NextResponse.json(
        { 
          error: `Decimal API error`,
          message: error.response.data?.error || error.response.statusText,
          statusCode: error.response.status
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      console.error('No response received from API:', error.request);
      return NextResponse.json(
        { 
          error: 'Gateway Timeout',
          message: 'No response from Decimal API',
          statusCode: 504
        },
        { status: 504 } // Gateway Timeout
      );
    } else {
      // Ошибка настройки запроса
      console.error('Request setup error:', error.message);
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
} 