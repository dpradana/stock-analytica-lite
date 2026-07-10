import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '@/utils/yahooFinance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 });
    }

    const symbols = symbolsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (symbols.length === 0) {
      return NextResponse.json({ quotes: {} });
    }

    let quotes: any[] = [];
    try {
      const quotesRes = await yahooFinance.quote(symbols);
      quotes = Array.isArray(quotesRes) ? quotesRes : [quotesRes];
    } catch (quoteErr: any) {
      console.error('Failed to fetch quote from yfinance:', quoteErr);
      return NextResponse.json({ error: quoteErr.message || 'Failed to fetch quote data' }, { status: 520 });
    }

    const result: Record<string, any> = {};
    quotes.forEach((q) => {
      if (q && q.symbol) {
        result[q.symbol] = {
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          currency: q.currency || 'USD',
          sector: q.sector || 'Unknown',
          beta: q.beta,
          marketCap: q.marketCap,
        };
      }
    });

    return NextResponse.json({ quotes: result });
  } catch (error: any) {
    console.error('Error in quote route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
