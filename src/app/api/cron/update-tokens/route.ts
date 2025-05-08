import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchTokens } from '@/utils/decimalApi';
import { headers } from 'next/headers';

export const runtime = 'edge';

export async function GET() {
  try {
    // Проверка авторизации
    const authHeader = headers().get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получение данных токенов
    const tokens = await fetchTokens();

    // Обновление данных в базе
    for (const token of tokens) {
      // Обновление данных токена
      const { error: tokenError } = await supabaseAdmin
        .from('tokens')
        .upsert({
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          price: token.price,
          reserve: token.reserve,
          crr: token.crr,
          wallets_count: token.wallets_count,
          delegation_percentage: token.delegation_percentage,
          updated_at: new Date().toISOString(),
        });

      if (tokenError) {
        console.error(`Ошибка обновления токена ${token.symbol}:`, tokenError);
        continue;
      }

      // Добавление исторических данных
      const { error: historyError } = await supabaseAdmin
        .from('token_history')
        .insert({
          token_id: token.id,
          price: token.price,
          reserve: token.reserve,
          crr: token.crr,
          wallets_count: token.wallets_count,
          delegation_percentage: token.delegation_percentage,
          timestamp: new Date().toISOString(),
        });

      if (historyError) {
        console.error(`Ошибка добавления истории для токена ${token.symbol}:`, historyError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка обновления токенов:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления токенов' },
      { status: 500 }
    );
  }
} 