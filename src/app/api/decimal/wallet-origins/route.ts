import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=600';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (address) {
      // Получаем данные о конкретном кошельке
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select(`
          address,
          chain_id,
          first_seen_at,
          first_funding_tx,
          first_funding_block,
          first_funding_from,
          first_funding_timestamp,
          first_funding_amount
        `)
        .eq('address', address)
        .eq('chain_id', 'decimal')
        .single();
      
      if (walletError) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }
      
      // Получаем кошелек, который пополнил текущий
      let parentWallet = null;
      if (wallet.first_funding_from) {
        const { data: fundingWallet, error: fundingWalletError } = await supabaseAdmin
          .from('wallets')
          .select(`
            address,
            chain_id,
            first_seen_at,
            first_funding_tx,
            first_funding_block,
            first_funding_from,
            first_funding_timestamp
          `)
          .eq('address', wallet.first_funding_from)
          .eq('chain_id', 'decimal')
          .single();
        
        if (!fundingWalletError) {
          parentWallet = fundingWallet;
        }
      }
      
      // Получаем кошельки, которые были пополнены текущим
      const { data: fundedWallets, error: fundedWalletsError } = await supabaseAdmin
        .from('wallet_origins')
        .select(`
          to_address,
          block_number,
          tx_hash,
          amount,
          timestamp
        `)
        .eq('from_address', address)
        .eq('from_chain_id', 'decimal')
        .order('block_number', { ascending: true })
        .range(offset, offset + limit - 1);
      
      return NextResponse.json({
        wallet,
        parentWallet,
        fundedWallets: fundedWallets || [],
        hasPrevious: offset > 0,
        hasMore: fundedWallets && fundedWallets.length === limit
      }, {
        headers: { 'Cache-Control': CACHE_CONTROL }
      });
    } else {
      // Получаем общую статистику и список первых пополнений
      const { data: origins, error: originsError } = await supabaseAdmin
        .from('wallet_origins')
        .select('*')
        .order('block_number', { ascending: true })
        .range(offset, offset + limit - 1);
      
      if (originsError) {
        return NextResponse.json({ error: 'Failed to fetch wallet origins' }, { status: 500 });
      }
      
      // Получаем общую статистику
      const { data: countData, error: countError } = await supabaseAdmin
        .from('wallet_origins')
        .select('id', { count: 'exact', head: true });
      
      const { data: statsData, error: statsError } = await supabaseAdmin.rpc('get_wallet_origins_stats');
      
      const stats = {
        total_records: countData?.length || 0,
        unique_funding_sources: statsData ? statsData[0].unique_funding_sources : 0,
        unique_funded_wallets: statsData ? statsData[0].unique_funded_wallets : 0
      };
      
      return NextResponse.json({
        stats,
        records: origins,
        hasPrevious: offset > 0,
        hasMore: origins && origins.length === limit
      }, {
        headers: { 'Cache-Control': CACHE_CONTROL }
      });
    }
  } catch (error) {
    console.error('Error retrieving wallet origins:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wallet origins' },
      { status: 500 }
    );
  }
}

// API для получения полной цепочки происхождения кошелька (вверх)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, maxDepth = 5 } = body;
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    
    // Получаем цепочку происхождения в одном запросе
    const { data: originChain, error: originChainError } = await supabaseAdmin.rpc(
      'get_wallet_origin_chain',
      { target_address: address, max_depth: maxDepth }
    );
    
    if (originChainError) {
      // Если RPC не настроена, реализуем вручную
      const chain = await getOriginChainManually(address, maxDepth);
      return NextResponse.json(chain, {
        headers: { 'Cache-Control': CACHE_CONTROL }
      });
    }
    
    return NextResponse.json(originChain, {
      headers: { 'Cache-Control': CACHE_CONTROL }
    });
  } catch (error) {
    console.error('Error retrieving wallet origin chain:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve wallet origin chain' },
      { status: 500 }
    );
  }
}

// Ручная функция для получения цепочки происхождения, если RPC не настроена
async function getOriginChainManually(walletAddress: string, maxDepth: number, currentDepth: number = 0): Promise<any> {
  if (currentDepth >= maxDepth) return null;
  
  const { data: wallet, error } = await supabaseAdmin
    .from('wallets')
    .select(`
      address,
      chain_id,
      first_funding_tx,
      first_funding_block,
      first_funding_from,
      first_funding_timestamp,
      first_funding_amount
    `)
    .eq('address', walletAddress)
    .eq('chain_id', 'decimal')
    .single();
  
  if (error || !wallet || !wallet.first_funding_from) return wallet || null;
  
  const parent = await getOriginChainManually(wallet.first_funding_from, maxDepth, currentDepth + 1);
  
  return {
    ...wallet,
    parent
  };
} 