import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  Search, 
  Info,
  Loader2
} from 'lucide-react';
import { IndicatorDataPoint } from '../types/stock';
import { addIndicators, formatCurrency } from '../utils/stockUtils';

interface StockAnalysisProps {
  initialSymbol?: string;
  livePrices: Record<string, number>;
}

interface CandlestickShapeProps {
  x?: number;
  width?: number;
  payload?: IndicatorDataPoint;
  yAxis?: {
    scale?: (val: number) => number;
  };
}

// Custom Candlestick shape for Recharts
const CandlestickShape = (props: CandlestickShapeProps) => {
  const { x = 0, width = 0, payload, yAxis } = props;
  if (!yAxis || !yAxis.scale || !payload) return null;

  const scaleY = yAxis.scale;
  const open = payload.open;
  const close = payload.close;
  const high = payload.high;
  const low = payload.low;

  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#f43f5e';
  const centerX = x + width / 2;

  const openY = scaleY(open);
  const closeY = scaleY(close);
  const highY = scaleY(high);
  const lowY = scaleY(low);

  const rectY = Math.min(openY, closeY);
  const rectHeight = Math.max(Math.abs(openY - closeY), 2); // Ensure it's visible

  return (
    <g>
      <line 
        x1={centerX} 
        y1={highY} 
        x2={centerX} 
        y2={lowY} 
        stroke={color} 
        strokeWidth={1.5} 
      />
      <rect 
        x={x} 
        y={rectY} 
        width={width} 
        height={rectHeight} 
        fill={color} 
        stroke={color} 
        strokeWidth={1}
      />
    </g>
  );
};

export default function StockAnalysis({ initialSymbol = 'AAPL', livePrices }: StockAnalysisProps) {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [interval, setInterval] = useState<'1D' | '1W' | '1M' | '1Y'>('1M');
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [activeStockInfo, setActiveStockInfo] = useState<any>({
    symbol: symbol,
    name: 'Loading...',
    sector: 'Unknown',
    price: 0,
    change: 0,
    changePercent: 0,
    currency: symbol.endsWith('.JK') ? 'IDR' : 'USD',
    beta: 1.0
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch active stock current details
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/stock/quote?symbols=${symbol}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quotes && data.quotes[symbol]) {
            setActiveStockInfo(data.quotes[symbol]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch active stock quote:', err);
      }
    };
    fetchQuote();
  }, [symbol]);

  // Fetch history for selected stock & interval
  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/stock/history?symbol=${symbol}&interval=${interval}`);
        if (res.ok && active) {
          const data = await res.json();
          if (data.data) {
            setRawHistory(data.data);
          }
          if (data.currency) {
            setActiveStockInfo((prev: any) => ({
              ...prev,
              currency: data.currency
            }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchHistory();
    return () => {
      active = false;
    };
  }, [symbol, interval]);

  // Debounced search autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.quotes) {
            setSearchResults(data.quotes);
          }
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute indicator data on render rather than inside a secondary render effect
  const chartData = useMemo(() => {
    if (rawHistory.length === 0) return [];
    return addIndicators(rawHistory);
  }, [rawHistory]);

  const livePrice = livePrices[symbol] || activeStockInfo.price;
  const liveChange = activeStockInfo.change || 0;
  const liveChangePercent = activeStockInfo.changePercent || 0;
  const currencyCode = activeStockInfo.currency || (symbol.endsWith('.JK') ? 'IDR' : 'USD');
  const betaVal = activeStockInfo.beta !== undefined && activeStockInfo.beta !== null ? activeStockInfo.beta : 1.0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-16 overflow-y-auto no-scrollbar md:ml-72">
      {/* Title & Ticker Selector Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Stock Analysis
          </h1>
          <p className="text-slate-400 text-sm mt-1">Interactive advanced charts, technical indicators, and price metrics.</p>
        </div>

        {/* Search Bar Autocomplete */}
        <div ref={dropdownRef} className="relative w-full md:w-80 z-30">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search ticker (e.g. BBRI, TLKM, AAPL)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-cyan/80 transition-colors"
            />
            {isSearchLoading && (
              <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-accent-cyan animate-spin" />
            )}
          </div>

          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50 backdrop-blur-md">
              {searchResults.length > 0 ? (
                searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => {
                      setSymbol(stock.symbol);
                      setActiveStockInfo(stock);
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900 text-left border-b border-slate-900 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-200">{stock.symbol}</div>
                      <div className="text-xs text-slate-500 max-w-[150px] truncate">{stock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-300">
                        {stock.price !== undefined ? formatCurrency(stock.price, stock.currency) : 'N/A'}
                      </div>
                      {stock.changePercent !== undefined && (
                        <span className={`text-[10px] font-bold ${stock.changePercent >= 0 ? 'text-accent-green' : 'text-accent-rose'}`}>
                          {(stock.changePercent >= 0 ? '+' : '') + stock.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500">
                  {searchQuery.trim().length < 2 ? 'Type at least 2 characters to search...' : 'No matching assets found'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stock Information Card */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800/85 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-accent-cyan/20 to-accent-blue/10 border border-accent-cyan/30 flex items-center justify-center font-extrabold text-lg text-accent-cyan shrink-0">
            {symbol}
          </div>
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-100">{activeStockInfo.name}</h2>
              <span className="text-xs text-slate-500 font-semibold uppercase">{activeStockInfo.sector}</span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Asset Type: Common Stock • Currency: {currencyCode}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Market Price</span>
            <p className="text-2xl font-extrabold text-white">{formatCurrency(livePrice, currencyCode)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Change (24h)</span>
            <p className={`text-xl font-bold flex items-center gap-0.5 ${liveChange >= 0 ? 'text-accent-green' : 'text-accent-rose'}`}>
              <span>{liveChange >= 0 ? '+' : ''}{formatCurrency(liveChange, currencyCode)}</span>
              <span className="text-xs font-semibold">({liveChangePercent.toFixed(2)}%)</span>
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Asset Beta</span>
            <p className="text-lg font-bold text-slate-300 flex items-center gap-1">
              {betaVal.toFixed(2)}
              <span title="Beta measures risk volatility relative to S&P 500 index.">
                <Info className="h-3.5 w-3.5 text-slate-600 hover:text-slate-400 cursor-pointer" />
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Chart Settings Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
        <div className="flex items-center gap-2">
          {/* Interval selectors */}
          {(['1D', '1W', '1M', '1Y'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setInterval(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                interval === t 
                  ? 'bg-accent-cyan/15 border-accent-cyan/40 text-accent-cyan' 
                  : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                chartType === 'line' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candle')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                chartType === 'candle' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Candle
            </button>
          </div>

          {/* Technical Indicator Toggles */}
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showRSI}
                onChange={(e) => setShowRSI(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-accent-cyan focus:ring-accent-cyan/30"
              />
              RSI (14)
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showMACD}
                onChange={(e) => setShowMACD(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-accent-cyan focus:ring-accent-cyan/30"
              />
              MACD
            </label>
          </div>
        </div>
      </div>

      {/* Main Charts Stacking Panel */}
      <div className="space-y-4">
        {/* Price Chart */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 h-[340px] flex flex-col relative">
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-10">
              <Loader2 className="h-8 w-8 text-accent-cyan animate-spin" />
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price Feed</span>
            {chartData.length > 0 && (
              <span className="text-xs text-slate-400">
                Range Close: {formatCurrency(chartData[0]?.close, currencyCode)} - {formatCurrency(chartData[chartData.length - 1]?.close, currencyCode)}
              </span>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickFormatter={(val) => formatCurrency(val, currencyCode)}
                    dx={-6}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b1528', borderColor: '#1e293b' }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    itemStyle={{ fontSize: 12 }}
                    formatter={(value: any) => [formatCurrency(Number(value), currencyCode), 'Price']}
                  />
                  {chartType === 'line' ? (
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#06b6d4" 
                      strokeWidth={2.5} 
                      dot={false}
                    />
                  ) : (
                    <Bar 
                      dataKey="close" 
                      shape={<CandlestickShape />} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                {isLoading ? 'Loading charts...' : 'No historical data available for this range.'}
              </div>
            )}
          </div>
        </div>

        {/* RSI Indicator Chart */}
        {showRSI && (
          <div className="glass-panel p-6 rounded-2xl border-slate-800/85 h-[180px] flex flex-col relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relative Strength Index (RSI 14)</span>
              <span className="text-xs font-semibold text-accent-cyan/90">
                {chartData.length > 0 ? chartData[chartData.length - 1]?.rsi : ''}
              </span>
            </div>
            <div className="flex-1 w-full min-h-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      ticks={[30, 50, 70]}
                      dx={-6}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0b1528', borderColor: '#1e293b' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                      itemStyle={{ fontSize: 12 }}
                    />
                    <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Overbought', fill: '#f43f5e', fontSize: 8, position: 'insideTopRight' }} />
                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Oversold', fill: '#10b981', fontSize: 8, position: 'insideBottomRight' }} />
                    <ReferenceLine y={50} stroke="#475569" strokeDasharray="5 5" strokeWidth={0.8} />
                    <Line 
                      type="monotone" 
                      dataKey="rsi" 
                      stroke="#a78bfa" 
                      strokeWidth={1.8} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No RSI details available
                </div>
              )}
            </div>
          </div>
        )}

        {/* MACD Indicator Chart */}
        {showMACD && (
          <div className="glass-panel p-6 rounded-2xl border-slate-800/85 h-[200px] flex flex-col relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MACD (12, 26, 9)</span>
              <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400">
                <span className="text-[#3b82f6]">MACD: {chartData.length > 0 ? chartData[chartData.length - 1]?.macd : ''}</span>
                <span className="text-[#f97316]">Signal: {chartData.length > 0 ? chartData[chartData.length - 1]?.signal : ''}</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" hide />
                    <YAxis 
                      stroke="#475569" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      dx={-6}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0b1528', borderColor: '#1e293b' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                      itemStyle={{ fontSize: 12 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="macd" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="signal" 
                      stroke="#f97316" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                    <Bar 
                      dataKey="histogram" 
                      fill="#10b981"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  No MACD details available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

