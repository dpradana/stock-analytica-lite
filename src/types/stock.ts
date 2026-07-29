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

export type ActiveTab = 'dashboard' | 'analysis' | 'portfolio' | 'risk' | 'screeners';

export interface ActionAnalysis {
  ticker: string;
  action: 'STRONG BUY' | 'BUY' | 'HOLD' | 'SELL' | 'TAKE PROFIT';
  is_bow: boolean;
  bow_message?: string;
  buy_price: number;
  target: number;
  target_label?: string;
  prediction: 'gain' | 'loss' | 'neutral';
  take_profit_target?: number;
  tp_days?: number;
  stop_loss: number;
  dividend_yield: number;
  confidence: number;
}

export interface CagrPoint {
  year: string;
  projectedPrice: number;
  projectedPortfolioValue: number;
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary?: string;
}

export interface ScreenerResultItem {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  score: number;
  category: 'dividend' | 'fundamental' | 'power' | 'longterm' | 'shortterm';
  dividendYield?: number;
  pe?: number;
  pbv?: number;
  roe?: number;
  volumeRatio?: number;
  powerScore?: number;
  targetUpside?: number;
  signalReason: string;
}

