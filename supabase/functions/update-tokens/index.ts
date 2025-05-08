import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch tokens from Decimal API
    const response = await fetch('https://api.decimalchain.com/api/v1/coins')
    const tokens = await response.json()

    // Update tokens in database
    for (const token of tokens) {
      // Update token data
      const { error: tokenError } = await supabaseClient
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
        })

      if (tokenError) {
        console.error(`Error updating token ${token.symbol}:`, tokenError)
        continue
      }

      // Insert historical data
      const { error: historyError } = await supabaseClient
        .from('token_history')
        .insert({
          token_id: token.id,
          price: token.price,
          reserve: token.reserve,
          crr: token.crr,
          wallets_count: token.wallets_count,
          delegation_percentage: token.delegation_percentage,
          timestamp: new Date().toISOString(),
        })

      if (historyError) {
        console.error(`Error inserting history for token ${token.symbol}:`, historyError)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 