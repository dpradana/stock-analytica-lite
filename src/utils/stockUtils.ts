import { StockDataPoint, IndicatorDataPoint } from '../types/stock';

// Calculate Exponential Moving Average (EMA)
export function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  if (prices.length === 0) return ema;

  const k = 2 / (period + 1);
  
  // Start with Simple Moving Average (SMA) for the first data point
  let sum = 0;
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i];
  }
  let currentEma = sum / Math.min(period, prices.length);
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      // Not enough data yet, use current running average or null/0
      ema.push(prices[i]);
    } else if (i === period - 1) {
      ema.push(currentEma);
    } else {
      currentEma = prices[i] * k + currentEma * (1 - k);
      ema.push(currentEma);
    }
  }
  return ema;
}

// Calculate Relative Strength Index (RSI)
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  if (prices.length <= period) {
    return new Array(prices.length).fill(50); // Default to middle ground if not enough data
  }

  let gains = 0;
  let losses = 0;

  // First period change
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Push dummy values for initial period
  for (let i = 0; i < period; i++) {
    rsi.push(50);
  }

  // First calculated RSI
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));

  // Subsequent values using Wilder's smoothing technique
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    let gain = 0;
    let loss = 0;

    if (diff > 0) {
      gain = diff;
    } else {
      loss = -diff;
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }

  return rsi;
}

// Add RSI and MACD indicators to StockDataPoint array
export function addIndicators(data: StockDataPoint[]): IndicatorDataPoint[] {
  const closes = data.map(d => d.close);
  const rsiValues = calculateRSI(closes, 14);

  // MACD Line = 12 EMA - 26 EMA
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  // Signal Line = 9 EMA of MACD Line
  const signalLine = calculateEMA(macdLine, 9);
  
  // Histogram = MACD Line - Signal Line
  const histogram: number[] = [];
  for (let i = 0; i < data.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return data.map((d, index) => ({
    ...d,
    rsi: Number(rsiValues[index].toFixed(2)),
    macd: Number(macdLine[index].toFixed(4)),
    signal: Number(signalLine[index].toFixed(4)),
    histogram: Number(histogram[index].toFixed(4))
  }));
}

// Format currency based on the code (IDR -> Rp, others -> $)
export function formatCurrency(value: number, currencyCode?: string): string {
  const isIDR = currencyCode === 'IDR';
  if (isIDR) {
    return 'Rp ' + Math.round(value).toLocaleString('id-ID');
  }
  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
