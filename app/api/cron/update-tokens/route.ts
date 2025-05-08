import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchTokens } from '@/utils/decimalApi'
import { headers } from 'next/headers'

export async function GET() {
  try {
    // Verify cron secret
    const headersList = headers()
    const authHeader = headersList.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Fetch tokens from Decimal API
    const tokens = await fetchTokens()

    // Update tokens in database
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
          market_cap: token.market_cap,
          updated_at: new Date().toISOString(),
        })

      if (tokenError) {
        console.error(`Error updating token ${token.symbol}:`, tokenError)
        continue
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
          market_cap: token.market_cap,
          timestamp: new Date().toISOString(),
        })

      if (historyError) {
        console.error(`Error inserting history for token ${token.symbol}:`, historyError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in update-tokens route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 