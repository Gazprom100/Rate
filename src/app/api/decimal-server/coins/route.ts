import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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
    
    // Используем axios вместо fetch с добавлением параметров пагинации
    const response = await axios.get('https://api.decimalchain.com/api/v1/coins', {
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
    
    // Проверяем формат ответа согласно документации
    // API должно возвращать { ok: boolean, result: [] }
    const data = response.data;
    
    if (data.ok && Array.isArray(data.result)) {
      console.log(`Successfully retrieved ${data.result.length} tokens from API`);
      return NextResponse.json(data.result);
    } else if (Array.isArray(data)) {
      // На случай, если API вернет массив напрямую
      console.log(`API returned array directly with ${data.length} tokens`);
      return NextResponse.json(data);
    } else {
      // Возвращаем данные как есть, если формат другой
      console.log('API returned response in unexpected format:', typeof data);
      return NextResponse.json(data);
    }
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