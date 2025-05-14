import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=600';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const address = url.searchParams.get('address');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const depth = parseInt(url.searchParams.get('depth') || '1');
    
    if (address) {
      // Получаем историю происхождения конкретного кошелька
      const wallet = await prisma.wallet.findUnique({
        where: { 
          address_chainId: { address, chainId: 'decimal' } 
        },
        select: {
          address: true,
          chainId: true,
          firstSeenAt: true,
          firstFundingTx: true,
          firstFundingBlock: true,
          firstFundingFrom: true,
          firstFundingTimestamp: true,
          firstFundingAmount: true,
          fundedBy: depth > 0 ? {
            select: {
              address: true,
              chainId: true,
              firstSeenAt: true,
              firstFundingTx: true,
              firstFundingFrom: true,
              firstFundingTimestamp: true,
              fundedBy: depth > 1 ? {
                select: {
                  address: true,
                  chainId: true,
                  firstSeenAt: true,
                  firstFundingTx: true,
                  firstFundingFrom: true,
                  firstFundingTimestamp: true
                }
              } : undefined
            }
          } : undefined,
          fundedWallets: {
            take: limit,
            skip: offset,
            orderBy: { firstFundingTimestamp: 'asc' },
            select: {
              address: true,
              chainId: true,
              firstSeenAt: true,
              firstFundingTx: true,
              firstFundingBlock: true,
              firstFundingTimestamp: true,
              firstFundingAmount: true
            }
          }
        }
      });
      
      if (!wallet) {
        return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
      }
      
      return NextResponse.json(wallet, {
        headers: { 'Cache-Control': CACHE_CONTROL }
      });
    } else {
      // Получаем список всех первых транзакций
      const firstFundings = await prisma.firstFunding.findMany({
        take: limit,
        skip: offset,
        orderBy: { blockNumber: 'asc' }
      });
      
      // Получаем статистику
      const statsPromise = prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_funding_records,
          COUNT(DISTINCT "fromAddress") as unique_funding_sources,
          COUNT(DISTINCT "toAddress") as unique_funded_wallets,
          AVG(CAST("amount" AS DECIMAL) / 1000000000000000000) as avg_funding_amount
        FROM "FirstFunding"
      `;
      
      const stats = await statsPromise;
      
      return NextResponse.json({
        stats: stats[0],
        records: firstFundings
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

// API для получения цепочки происхождения кошелька (вверх)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, maxDepth = 5 } = body;
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }
    
    // Функция для рекурсивного получения цепочки происхождения
    async function getOriginChain(walletAddress: string, currentDepth: number): Promise<any> {
      if (currentDepth > maxDepth) return null;
      
      const wallet = await prisma.wallet.findUnique({
        where: { 
          address_chainId: { address: walletAddress, chainId: 'decimal' } 
        },
        select: {
          address: true,
          firstFundingTx: true,
          firstFundingBlock: true,
          firstFundingFrom: true,
          firstFundingTimestamp: true,
          firstFundingAmount: true
        }
      });
      
      if (!wallet || !wallet.firstFundingFrom) return wallet;
      
      const parent = await getOriginChain(wallet.firstFundingFrom, currentDepth + 1);
      return {
        ...wallet,
        parent
      };
    }
    
    const originChain = await getOriginChain(address, 1);
    
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