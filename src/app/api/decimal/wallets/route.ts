import { NextResponse } from 'next/server';
import { getWalletStatistics, getActiveWalletAddresses } from '@/utils/evmApi';

// Cache control - 30 minutes
const CACHE_CONTROL = 'public, s-maxage=1800, stale-while-revalidate=600';

export async function GET(request: Request) {
  try {
    // Get wallet statistics from Decimal EVM blockchain
    const stats = await getWalletStatistics(1000); // Get stats from last 1000 blocks

    // Format response data
    const responseData = {
      total_unique_wallets: stats.totalUniqueWallets,
      active_wallets: stats.activeWallets,
      active_percentage: stats.totalUniqueWallets > 0 
        ? (stats.activeWallets / stats.totalUniqueWallets * 100).toFixed(2) 
        : 0,
      block_range: 1000,
      timestamp: new Date().toISOString()
    };

    // Return response with cache headers
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': CACHE_CONTROL
      }
    });
  } catch (error) {
    console.error('Error fetching wallet statistics:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch wallet statistics' },
      { status: 500 }
    );
  }
}

// This route can potentially take a long time to execute
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
