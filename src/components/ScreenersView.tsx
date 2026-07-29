import React, { useState, useMemo } from 'react';
import { ScreenerResultItem } from '../types/stock';
import { formatCurrency } from '../utils/stockUtils';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  CheckCircle
} from 'lucide-react';

interface ScreenersViewProps {
  onSelectTickerForAnalysis: (ticker: string) => void;
  livePrices?: Record<string, number>;
}

const MOCK_SCREENER_DATA: ScreenerResultItem[] = [
  // Dividend Stocks
  {
    ticker: 'BBCA.JK',
    name: 'Bank Central Asia Tbk',
    price: 10250,
    changePercent: 1.2,
    score: 92,
    category: 'dividend',
    dividendYield: 4.8,
    pe: 22.4,
    roe: 21.5,
    signalReason: 'High Dividend Yield, Safe Payout Ratio (45%), Strong ROE > 20%'
  },
  {
    ticker: 'BBRI.JK',
    name: 'Bank Rakyat Indonesia Tbk',
    price: 5300,
    changePercent: -0.4,
    score: 88,
    category: 'dividend',
    dividendYield: 5.9,
    pe: 14.2,
    roe: 19.8,
    signalReason: 'Attractive 5.9% Dividend Yield, Undervalued vs Historical PE'
  },
  {
    ticker: 'TLKM.JK',
    name: 'Telkom Indonesia Tbk',
    price: 3750,
    changePercent: 0.8,
    score: 84,
    category: 'dividend',
    dividendYield: 5.2,
    pe: 15.1,
    roe: 17.2,
    signalReason: 'Steady Cash Flow, High Dividend Yield, Telecom Sector Dominance'
  },
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    price: 198.50,
    changePercent: 1.4,
    score: 89,
    category: 'dividend',
    dividendYield: 2.3,
    pe: 11.8,
    roe: 16.9,
    signalReason: 'Consistent Dividend Growth (11 consecutive years), Tier 1 Capital Reserve'
  },

  // Fundamental Stocks
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 885.00,
    changePercent: 3.5,
    score: 95,
    category: 'fundamental',
    pe: 34.5,
    roe: 48.2,
    targetUpside: 25.0,
    signalReason: 'Revenue Growth > 120% YoY, AI Compute Market Leadership'
  },
  {
    ticker: 'BMRI.JK',
    name: 'Bank Mandiri Tbk',
    price: 6800,
    changePercent: 1.8,
    score: 90,
    category: 'fundamental',
    pe: 11.5,
    roe: 20.1,
    targetUpside: 18.5,
    signalReason: 'Double-digit Net Income Growth, Undervalued PE < 12'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    price: 412.50,
    changePercent: 0.9,
    score: 93,
    category: 'fundamental',
    pe: 35.1,
    roe: 38.4,
    targetUpside: 20.0,
    signalReason: 'Cloud Azure Growth 30%+, High Profit Margins'
  },

  // Power Close Signals
  {
    ticker: 'ASII.JK',
    name: 'Astra International Tbk',
    price: 5150,
    changePercent: 2.7,
    score: 91,
    category: 'power',
    volumeRatio: 2.3,
    powerScore: 8.7,
    signalReason: '⚡ Volume Surge 2.3x average with closing near session high'
  },
  {
    ticker: 'TSLA',
    name: 'Tesla, Inc.',
    price: 248.20,
    changePercent: 4.8,
    score: 87,
    category: 'power',
    volumeRatio: 1.9,
    powerScore: 7.9,
    signalReason: '⚡ Bullish breakout candle at closing hour with high volume'
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    price: 182.30,
    changePercent: 1.5,
    score: 86,
    category: 'power',
    volumeRatio: 1.6,
    powerScore: 7.2,
    signalReason: '⚡ Smart Money Accumulation detected in final 30 minutes'
  },

  // Long Term Picks
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 172.10,
    changePercent: 0.6,
    score: 94,
    category: 'longterm',
    pe: 23.8,
    roe: 27.3,
    targetUpside: 30.0,
    signalReason: 'Wide Moat Search & Cloud Infrastructure, 3-5 Year Growth Target +30%'
  },
  {
    ticker: 'BBCA.JK',
    name: 'Bank Central Asia Tbk',
    price: 10250,
    changePercent: 1.2,
    score: 96,
    category: 'longterm',
    pe: 22.4,
    roe: 21.5,
    targetUpside: 22.0,
    signalReason: 'Premier Indonesian Banking Franchise, Strong CAGR 10y record'
  },

  // Short Term Momentum
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 185.40,
    changePercent: 2.9,
    score: 89,
    category: 'shortterm',
    volumeRatio: 1.8,
    targetUpside: 12.0,
    signalReason: '📉 10-Day EMA Golden Cross Rebound, target upside +12% in ~10 days'
  },
  {
    ticker: 'TLKM.JK',
    name: 'Telkom Indonesia Tbk',
    price: 3750,
    changePercent: 0.8,
    score: 85,
    category: 'shortterm',
    volumeRatio: 1.4,
    targetUpside: 8.5,
    signalReason: '📉 RSI Oversold rebound confirmed at support level'
  }
];

export default function ScreenersView({ onSelectTickerForAnalysis, livePrices }: ScreenersViewProps) {
  const [activeTab, setActiveTab] = useState<'dividend' | 'fundamental' | 'power' | 'longterm' | 'shortterm'>('dividend');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredItems = useMemo(() => {
    return MOCK_SCREENER_DATA.filter((item) => {
      const matchesTab = item.category === activeTab;
      const matchesSearch = 
        item.ticker.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.name.toLowerCase().includes(searchFilter.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchFilter]);

  const tabConfig = [
    { key: 'dividend', label: '💰 Dividend', color: 'text-emerald-400 border-emerald-500 bg-emerald-500/10' },
    { key: 'fundamental', label: '📊 Fundamental', color: 'text-blue-400 border-blue-500 bg-blue-500/10' },
    { key: 'power', label: '⚡ Power Close', color: 'text-amber-400 border-amber-500 bg-amber-500/10' },
    { key: 'longterm', label: '📈 Long Term', color: 'text-indigo-400 border-indigo-500 bg-indigo-500/10' },
    { key: 'shortterm', label: '📉 Short Term', color: 'text-rose-400 border-rose-500 bg-rose-500/10' },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-16 overflow-y-auto no-scrollbar md:ml-72">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            🎯 Smart Stock Screeners
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time algorithmic screening strategies for US & IDX markets
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter screener results..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabConfig.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border ${
                isActive
                  ? tab.color
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Description Banner */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 flex items-center gap-3 text-sm text-slate-300">
        <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          {activeTab === 'dividend' && 'Displays top dividend-paying stocks with yield > 4%, steady payout history, and sustainable cash coverage.'}
          {activeTab === 'fundamental' && 'Filters undervalued value stocks with P/E < 20, robust return on equity (ROE > 15%), and strong revenue growth.'}
          {activeTab === 'power' && 'Highlights momentum stocks showing end-of-day volume surges (>1.5x 20-day MA) closing near day highs.'}
          {activeTab === 'longterm' && 'Quality market leaders with competitive moats, compounding growth, and multi-year investment potential.'}
          {activeTab === 'shortterm' && 'High-probability technical swing setups with defined entry points and risk-reward upside targets.'}
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Ticker & Company</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Screener Score</th>
                <th className="px-6 py-4">Key Metrics</th>
                <th className="px-6 py-4">Signal Rationale</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => {
                const currentPrice = livePrices?.[item.ticker] || item.price;
                const isIDR = item.ticker.endsWith('.JK');
                
                return (
                  <tr key={item.ticker} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-100">{item.ticker}</div>
                      <div className="text-xs text-slate-400">{item.name}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {formatCurrency(currentPrice, isIDR ? 'IDR' : 'USD')}
                      </div>
                      <div className={`text-xs flex items-center gap-0.5 ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent}%
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-200">{item.score}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        {item.dividendYield !== undefined && (
                          <span className="inline-block bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium mr-1">
                            Yield: {item.dividendYield}%
                          </span>
                        )}
                        {item.pe !== undefined && (
                          <span className="inline-block bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-medium mr-1">
                            P/E: {item.pe}
                          </span>
                        )}
                        {item.volumeRatio !== undefined && (
                          <span className="inline-block bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-medium mr-1">
                            Vol Ratio: {item.volumeRatio}x
                          </span>
                        )}
                        {item.targetUpside !== undefined && (
                          <span className="inline-block bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
                            Upside: +{item.targetUpside}%
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-300 max-w-xs">
                      {item.signalReason}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectTickerForAnalysis(item.ticker)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 ml-auto"
                      >
                        Analyze <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No screener results found for this category or filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
