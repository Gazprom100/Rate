import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchTokens } from '@/utils/decimalApi';

export const runtime = 'edge';

export async function GET() {
  try {
    // Fetch latest token data
    const tokens = await fetchTokens();

    // Update tokens in Supabase
    for (const token of tokens) {
      // Update token data
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
        console.error(`Error updating token ${token.symbol}:`, tokenError);
        continue;
      }

      // Insert historical data
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
        console.error(`Error inserting history for token ${token.symbol}:`, historyError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tokens:', error);
    return NextResponse.json(
      { error: 'Failed to update tokens' },
      { status: 500 }
    );
  }
} 