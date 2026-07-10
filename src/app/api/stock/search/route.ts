import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '@/utils/yahooFinance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ quotes: [] });
    }

    const searchRes = await yahooFinance.search(query);
    
    // Filter to keep only quotes with symbols (mainly equities, ETFs, indices)
    const validQuotes = (searchRes.quotes || []).filter(
      (item) => item.symbol && item.isYahooFinance
    );

    const symbols = validQuotes.slice(0, 7).map((item) => item.symbol);

    if (symbols.length === 0) {
      return NextResponse.json({ quotes: [] });
    }

    // Fetch batch quotes to get live price info
    let quotes: any[] = [];
    try {
      const quotesRes = await yahooFinance.quote(symbols as string[]);
      quotes = Array.isArray(quotesRes) ? quotesRes : [quotesRes];
    } catch (quoteErr) {
      console.error('Failed to fetch batch quotes for search results:', quoteErr);
      // Fail gracefully and continue mapping with undefined prices
    }

    const mappedQuotes = validQuotes.slice(0, 7).map((item) => {
      const quote = quotes.find((q) => q.symbol === item.symbol);
      return {
        symbol: item.symbol,
        name: item.longname || item.shortname || item.symbol,
        price: quote ? quote.regularMarketPrice : undefined,
        change: quote ? quote.regularMarketChange : undefined,
        changePercent: quote ? quote.regularMarketChangePercent : undefined,
        currency: quote ? quote.currency : 'USD',
        sector: item.sector || quote?.sector || 'Unknown',
        exchange: item.exchDisp || item.exchange || 'Unknown',
      };
    });

    return NextResponse.json({ quotes: mappedQuotes });
  } catch (error: any) {
    console.error('Error in search route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
