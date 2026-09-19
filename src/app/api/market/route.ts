import { NextResponse } from 'next/server';
import { getMarketOverviewData, getMarketQuote } from '@/lib/providers/market';
import { db } from '@/db';

export async function GET() {
  try {
    const overview = await getMarketOverviewData();
    const companies = db.getNifty50Companies();

    // Pick a subset of active top movers to show gainers and losers
    const topSymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'LT', 'BAJFINANCE', 'MARUTI', 'TITAN', 'TRENT', 'BEL'];
    const quotes = await Promise.all(
      topSymbols.map(async (s) => {
        const q = await getMarketQuote(s);
        const comp = companies.find(c => c.ticker === s);
        return {
          quote: q,
          symbol: s,
          name: comp?.shortName || s,
          slug: comp?.slug || s.toLowerCase(),
          price: q?.price ?? null,
          change: q?.change ?? null,
          changePercent: q?.changePercent ?? null,
        };
      })
    );

    const sortedByGain = [...quotes].sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
    const gainers = sortedByGain.filter(q => q.changePercent !== null && q.changePercent > 0).slice(0, 5);
    const losers = [...sortedByGain].reverse().filter(q => q.changePercent !== null && q.changePercent < 0).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        indices: overview.indices,
        marketBreadth: overview.marketBreadth,
        gainers,
        losers,
        updatedAt: overview.updatedAt,
        moversScope: 'Selected companies only; not all NSE/BSE securities',
        breadthStatus: 'unavailable',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
