import React, { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Briefcase, 
  Percent, 
  Activity,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { PortfolioItem, IndexInfo } from '../types/stock';
import { formatCurrency } from '../utils/stockUtils';

interface DashboardProps {
  portfolio: PortfolioItem[];
  indices: IndexInfo[];
  portfolioHistory: { date: string; value: number }[];
  onNavigateToAnalysis: (ticker: string) => void;
  quotes: Record<string, any>;
}

export default function Dashboard({ 
  portfolio, 
  indices, 
  portfolioHistory,
  onNavigateToAnalysis,
  quotes
}: DashboardProps) {
  
  const USD_TO_IDR = 16300;

  // Determine target currency of the dashboard totals. If portfolio has IDR, show everything in IDR.
  const hasIDR = useMemo(() => {
    return portfolio.some(item => item.currency === 'IDR');
  }, [portfolio]);

  const targetCurrency = hasIDR ? 'IDR' : 'USD';

  const convertValue = (val: number, from: string, to: string) => {
    if (from === to) return val;
    if (from === 'USD' && to === 'IDR') return val * USD_TO_IDR;
    if (from === 'IDR' && to === 'USD') return val / USD_TO_IDR;
    return val;
  };

  // Calculate aggregate portfolio stats converted to target currency
  const totalValue = useMemo(() => {
    return portfolio.reduce((sum, item) => sum + convertValue(item.currentValue, item.currency || 'USD', targetCurrency), 0);
  }, [portfolio, targetCurrency]);

  const totalCost = useMemo(() => {
    return portfolio.reduce((sum, item) => sum + convertValue(item.totalCost, item.currency || 'USD', targetCurrency), 0);
  }, [portfolio, targetCurrency]);

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const isProfit = totalGainLoss >= 0;

  // Premium watchlist: blend of Indo financial/telecom and US tech leaders
  const watchlistSymbols = ['BBRI.JK', 'TLKM.JK', 'BBCA.JK', 'AAPL', 'MSFT', 'NVDA'];

  // Mock financial news to add realism and high-end aesthetic
  const mockNews = [
    {
      id: 1,
      source: 'MarketWire',
      time: '10m ago',
      title: 'Jakarta Composite Index (JCI) trends upward as foreign capital inflows increase.',
      impact: 'positive'
    },
    {
      id: 2,
      source: 'Fed Watcher',
      time: '1h ago',
      title: 'Federal Reserve officials hint at holding interest rates steady in upcoming session.',
      impact: 'neutral'
    },
    {
      id: 3,
      source: 'IDX News',
      time: '3h ago',
      title: 'Bank Rakyat Indonesia (BBRI) reports strong micro-loan disbursements for Q2.',
      impact: 'positive'
    },
    {
      id: 4,
      source: 'TechPulse',
      time: '5h ago',
      title: 'Apple targets fall release for new AI features integration in next-gen operating systems.',
      impact: 'positive'
    }
  ];

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 pb-16 overflow-y-auto no-scrollbar md:ml-72">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Executive Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time overview of markets, assets, and allocation profiles.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400">
          <Activity className="h-4 w-4 text-accent-cyan pulse-glow-active rounded-full" />
          <span>yfinance Real-time Stream Active</span>
        </div>
      </div>

      {/* Index Ticker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {indices.map((idx) => {
          const isIndexUp = idx.change >= 0;
          // Format data for sparkline
          const sparklineData = idx.history.map((val, i) => ({ id: i, value: val }));
          const currency = idx.currency || (idx.symbol === '^JKSE' ? 'IDR' : 'USD');
          
          return (
            <div 
              key={idx.symbol}
              className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-800/80 hover:border-slate-700/50 transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500">{idx.name}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold tracking-tight">
                    {formatCurrency(idx.price, currency)}
                  </span>
                </div>
                <div className={`flex items-center text-xs font-semibold ${isIndexUp ? 'text-accent-green' : 'text-accent-rose'}`}>
                  {isIndexUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  <span>{isIndexUp ? '+' : ''}{idx.changePercent.toFixed(2)}%</span>
                </div>
              </div>
              <div className="w-24 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={isIndexUp ? '#10b981' : '#f43f5e'} 
                      strokeWidth={1.8} 
                      dot={false} 
                    />
                    <XAxis dataKey="id" hide />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Asset Value */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 relative overflow-hidden glass-card-glow">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <DollarSign className="h-24 w-24 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Asset Value (NAV)</p>
          <p className="text-3xl font-extrabold mt-2 tracking-tight text-white">
            {formatCurrency(totalValue, targetCurrency)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="text-slate-500">Base Currency:</span>
            <span className="font-semibold text-slate-300">{targetCurrency}</span>
            {hasIDR && (
              <span className="text-[10px] text-slate-500 font-normal">
                (Converted USD assets at 1 USD = {USD_TO_IDR.toLocaleString('id-ID')} Rp)
              </span>
            )}
          </div>
        </div>

        {/* Total Return */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 relative overflow-hidden glass-card-glow">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Percent className="h-24 w-24 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Return</p>
          <p className={`text-3xl font-extrabold mt-2 tracking-tight flex items-baseline gap-1.5 ${isProfit ? 'text-accent-green' : 'text-accent-rose'}`}>
            <span>{isProfit ? '+' : ''}{formatCurrency(totalGainLoss, targetCurrency)}</span>
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold">
            <span className={`flex items-center gap-0.5 ${isProfit ? 'text-accent-green' : 'text-accent-rose'}`}>
              {isProfit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isProfit ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </span>
            <span className="text-slate-500 font-normal">all-time returns</span>
          </div>
        </div>

        {/* Invested Capital */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 relative overflow-hidden glass-card-glow">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Briefcase className="h-24 w-24 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invested Capital</p>
          <p className="text-3xl font-extrabold mt-2 tracking-tight text-white">
            {formatCurrency(totalCost, targetCurrency)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs">
            <span className="text-slate-500">Assets Tracked:</span>
            <span className="font-semibold text-slate-300">{portfolio.length} positions</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Performance Chart */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 lg:col-span-2 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-200">Portfolio Growth Curve</h3>
              <p className="text-xs text-slate-500">Historical performance based on current holdings</p>
            </div>
            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-accent-cyan">
              1M Timeline
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatCurrency(val, targetCurrency)}
                  domain={['dataMin - 50', 'dataMax + 50']}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value), targetCurrency), 'Portfolio Value']}
                  contentStyle={{ backgroundColor: '#0b1528', borderColor: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#06b6d4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Watchlist & Trends */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 flex flex-col h-[400px]">
          <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-5 w-5 text-accent-cyan" />
            <span>Active Markets & Watchlist</span>
          </h3>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-1">
            {watchlistSymbols.map((sym) => {
              const stock = quotes[sym] || {
                symbol: sym,
                name: sym.endsWith('.JK') ? 'Indo Stock' : 'US Stock',
                price: sym.endsWith('.JK') ? 2500 : 150,
                changePercent: 0,
                currency: sym.endsWith('.JK') ? 'IDR' : 'USD'
              };
              const isStockUp = (stock.changePercent || 0) >= 0;
              const currency = stock.currency || (sym.endsWith('.JK') ? 'IDR' : 'USD');
              
              return (
                <div 
                  key={sym}
                  onClick={() => onNavigateToAnalysis(sym)}
                  className="flex items-center justify-between p-3 bg-slate-900/30 hover:bg-slate-800/40 border border-slate-800/60 hover:border-slate-700/50 rounded-xl transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 group-hover:border-accent-cyan/40 group-hover:text-accent-cyan transition-colors">
                      {sym.replace('.JK', '').substring(0, 4)}
                    </div>
                    <div className="max-w-[100px] sm:max-w-[120px] truncate">
                      <h4 className="font-bold text-sm text-slate-200 leading-none">{sym}</h4>
                      <span className="text-[11px] text-slate-500 font-medium truncate block mt-0.5">{stock.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-slate-200">
                      {stock.price !== undefined ? formatCurrency(stock.price, currency) : 'N/A'}
                    </p>
                    <span className={`inline-flex items-center text-xs font-semibold ${isStockUp ? 'text-accent-green' : 'text-accent-rose'}`}>
                      {isStockUp ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* News & Updates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real-time Market News */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85">
          <h3 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2">
            <span>Market Intelligence</span>
            <span className="h-2 w-2 rounded-full bg-accent-cyan pulse-glow-active" />
          </h3>
          <div className="space-y-4">
            {mockNews.map((news) => (
              <div 
                key={news.id} 
                className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-900 hover:border-slate-800 transition-all flex items-start gap-3.5 group cursor-pointer"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-accent-cyan bg-accent-cyan/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{news.source}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{news.time}</span>
                  </div>
                  <h4 className="font-medium text-xs text-slate-200 leading-relaxed group-hover:text-white transition-colors">{news.title}</h4>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-accent-cyan transition-colors self-center flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Current Allocation Stats Preview */}
        <div className="glass-panel p-6 rounded-2xl border-slate-800/85 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-200 mb-1">Asset Allocation Overview</h3>
            <p className="text-xs text-slate-500 mb-5">High-level distribution of current holdings by value</p>
          </div>
          {portfolio.length > 0 ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {portfolio.slice(0, 4).map((item) => {
                const percent = (item.currentValue / totalValue) * 100;
                return (
                  <div key={item.symbol} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">{item.symbol}</span>
                      <span className="text-slate-400">
                        {percent.toFixed(1)}% ({formatCurrency(item.currentValue, targetCurrency)})
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 border border-slate-800/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-cyan to-accent-blue rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {portfolio.length > 4 && (
                <p className="text-[11px] text-slate-500 text-center font-medium mt-2">
                  + {portfolio.length - 4} other assets tracked. Open &quot;Risk &amp; Allocations&quot; tab for details.
                </p>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
              <p className="text-sm font-semibold text-slate-400">No portfolio allocations found</p>
              <p className="text-xs text-slate-600 max-w-xs mt-1">
                Navigate to the &quot;Portfolio Tracker&quot; tab and enter purchase transactions to see details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
