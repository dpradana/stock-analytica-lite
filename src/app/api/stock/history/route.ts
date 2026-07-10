import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from '@/utils/yahooFinance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const symbol = searchParams.get('symbol');
    const intervalType = searchParams.get('interval') || '1M'; // '1D' | '1W' | '1M' | '1Y'

    if (!symbol) {
      return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    const now = new Date();
    let period1 = new Date();
    let yfInterval: '15m' | '1h' | '1d' = '1d';

    if (intervalType === '1D') {
      // 1 day ago, 15m intervals
      period1.setDate(now.getDate() - 1);
      yfInterval = '15m';
    } else if (intervalType === '1W') {
      // 7 days ago, 1h intervals
      period1.setDate(now.getDate() - 7);
      yfInterval = '1h';
    } else if (intervalType === '1M') {
      // 30 days ago, 1d intervals
      period1.setDate(now.getDate() - 30);
      yfInterval = '1d';
    } else if (intervalType === '1Y') {
      // 365 days ago, 1d intervals
      period1.setDate(now.getDate() - 365);
      yfInterval = '1d';
    }

    const period1Sec = Math.floor(period1.getTime() / 1000);
    const period2Sec = Math.floor(now.getTime() / 1000);

    const chartRes = await yahooFinance.chart(symbol, {
      period1: period1Sec,
      period2: period2Sec,
      interval: yfInterval,
    });

    const quotes = chartRes.quotes || [];
    const meta = chartRes.meta || {};
    const currency = meta.currency || 'USD';

    // Format results to match StockDataPoint
    const formattedData = quotes
      .filter((q) => q.close !== null && q.close !== undefined && q.open !== null && q.open !== undefined)
      .map((q) => {
        const dateObj = new Date(q.date);
        let dateStr = '';

        if (intervalType === '1D') {
          // Format as time (HH:MM)
          dateStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (intervalType === '1W') {
          // Format as date and time (Mon DD, HH:MM)
          dateStr = `${dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' })} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        } else {
          // Format as date (Mon DD)
          dateStr = dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' });
        }

        return {
          date: dateStr,
          open: Number((q.open ?? 0).toFixed(2)),
          high: Number((q.high ?? 0).toFixed(2)),
          low: Number((q.low ?? 0).toFixed(2)),
          close: Number((q.close ?? 0).toFixed(2)),
          volume: q.volume || 0,
        };
      });

    return NextResponse.json({
      symbol,
      currency,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Error in history route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
