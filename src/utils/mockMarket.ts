import { StockDataPoint, IndexInfo } from '../types/stock';

export interface TickerDetails {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  beta: number;
  sector: string;
}

export const SUPPORTED_TICKERS: Record<string, TickerDetails> = {
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 1.24, changePercent: 0.66, beta: 1.15, sector: 'Technology' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.55, change: -2.31, changePercent: -0.55, beta: 1.05, sector: 'Technology' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.30, change: 0.88, changePercent: 0.50, beta: 1.10, sector: 'Communication Services' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 185.50, change: 3.12, changePercent: 1.71, beta: 1.20, sector: 'Consumer Cyclical' },
  TSLA: { symbol: 'TSLA', name: 'Tesla Inc.', price: 177.46, change: -5.40, changePercent: -2.95, beta: 1.60, sector: 'Consumer Cyclical' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 924.79, change: 18.24, changePercent: 2.01, beta: 1.75, sector: 'Technology' },
  META: { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.58, change: -4.12, changePercent: -0.84, beta: 1.25, sector: 'Communication Services' },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', price: 610.30, change: 5.80, changePercent: 0.96, beta: 1.30, sector: 'Communication Services' },
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 195.40, change: 0.65, changePercent: 0.33, beta: 0.82, sector: 'Financial Services' },
  V: { symbol: 'V', name: 'Visa Inc.', price: 275.20, change: -1.10, changePercent: -0.40, beta: 0.95, sector: 'Financial Services' },
  JNJ: { symbol: 'JNJ', name: 'Johnson & Johnson', price: 148.90, change: -0.22, changePercent: -0.15, beta: 0.55, sector: 'Healthcare' },
  LLY: { symbol: 'LLY', name: 'Eli Lilly & Co.', price: 785.10, change: 12.30, changePercent: 1.59, beta: 0.90, sector: 'Healthcare' }
};

// Seeded random number generator for reproducible charts
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate data helper
export function generateMockHistory(
  symbol: string,
  interval: '1D' | '1W' | '1M' | '1Y'
): StockDataPoint[] {
  const details = SUPPORTED_TICKERS[symbol] || { price: 100, beta: 1 };
  const basePrice = details.price;
  const beta = details.beta;
  
  let pointsCount = 100;
  let timeStepMinutes = 60;
  const data: StockDataPoint[] = [];

  if (interval === '1D') {
    pointsCount = 26; // 9:30 AM to 4:00 PM in 15 minute steps
    timeStepMinutes = 15;
  } else if (interval === '1W') {
    pointsCount = 7;
  } else if (interval === '1M') {
    pointsCount = 30;
  } else if (interval === '1Y') {
    pointsCount = 250; // Trading days in a year
  }

  // Use a unique numeric seed for each symbol to get consistent starting charts
  let seedValue = 0;
  for (let i = 0; i < symbol.length; i++) {
    seedValue += symbol.charCodeAt(i);
  }

  let currentPrice = basePrice;
  const now = new Date();

  // Walk backwards to construct historical prices, then reverse
  for (let i = 0; i < pointsCount; i++) {
    const rand = seededRandom(seedValue + i);
    // Volatility depends on asset beta
    const dailyVolatility = 0.015 * beta;
    const changePercent = (rand - 0.49) * dailyVolatility; // slight upward drift on avg
    
    const close = currentPrice;
    const open = currentPrice / (1 + changePercent);
    const high = Math.max(open, close) * (1 + seededRandom(seedValue - i) * 0.005);
    const low = Math.min(open, close) * (1 - seededRandom(seedValue * 2 - i) * 0.005);
    const volume = Math.floor((100000 + seededRandom(seedValue + i) * 900000) * beta);

    let dateStr = '';
    const dateCopy = new Date(now.getTime());

    if (interval === '1D') {
      // Step backwards in minutes from 4:00 PM today
      const minutesToSubtract = i * timeStepMinutes;
      dateCopy.setHours(16, 0, 0, 0); // Start at 4:00 PM
      dateCopy.setTime(dateCopy.getTime() - minutesToSubtract * 60 * 1000);
      dateStr = dateCopy.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Step backwards in days
      dateCopy.setDate(now.getDate() - i);
      dateStr = dateCopy.toLocaleDateString([], { month: 'short', day: '2-digit' });
    }

    data.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });

    currentPrice = open; // Continue walking backwards
  }

  return data.reverse();
}

// Generate real-time random price updates for active stocks
export function simulatePriceUpdate(symbol: string, currentPrice: number): { price: number, change: number, changePercent: number } {
  const details = SUPPORTED_TICKERS[symbol] || { beta: 1 };
  const rand = Math.random();
  const tickSize = 0.001 * details.beta;
  const changePercent = (rand - 0.5) * tickSize;
  const newPrice = currentPrice * (1 + changePercent);
  
  const basePrice = SUPPORTED_TICKERS[symbol]?.price || 100;
  const change = newPrice - basePrice;
  const changePct = (change / basePrice) * 100;

  return {
    price: Number(newPrice.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePct.toFixed(2))
  };
}

export function getMockMarketIndices(): IndexInfo[] {
  return [
    {
      symbol: 'SPY',
      name: 'S&P 500 ETF',
      price: 512.44,
      change: 3.52,
      changePercent: 0.69,
      history: [508, 509, 511, 510, 511, 512.44]
    },
    {
      symbol: 'QQQ',
      name: 'NASDAQ 100 ETF',
      price: 438.60,
      change: 5.12,
      changePercent: 1.18,
      history: [431, 433, 435, 434, 436, 438.60]
    },
    {
      symbol: '^JKSE',
      name: 'Jakarta Composite',
      price: 7200.00,
      change: 25.40,
      changePercent: 0.35,
      history: [7150, 7170, 7160, 7190, 7180, 7200.00]
    }
  ];
}
