export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  date: string;
}

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorDataPoint extends StockDataPoint {
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
}

export interface PortfolioItem {
  symbol: string;
  totalQuantity: number;
  totalCost: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  currency?: string;
  sector?: string;
  beta?: number;
}

export interface IndexInfo {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  currency?: string;
}

export type ActiveTab = 'dashboard' | 'analysis' | 'portfolio' | 'risk';
