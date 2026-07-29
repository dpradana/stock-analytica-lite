import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  History,
  Loader2,
  Brain,
  ShieldAlert,
  RefreshCw,
  DollarSign,
  Flame,
  X
} from 'lucide-react';
import { Transaction, PortfolioItem } from '../types/stock';
import { formatCurrency } from '../utils/stockUtils';

interface PortfolioTrackerProps {
  transactions: Transaction[];
  portfolio: PortfolioItem[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function PortfolioTracker({
  transactions,
  portfolio,
  onAddTransaction,
  onDeleteTransaction
}: PortfolioTrackerProps) {
  
  // Form states
  const [symbol, setSymbol] = useState('BBCA.JK');
  const [price, setPrice] = useState('10250');
  const [quantity, setQuantity] = useState('100');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStockInfo, setSelectedStockInfo] = useState<any>({
    symbol: 'BBCA.JK',
    name: 'Bank Central Asia Tbk',
    currency: 'IDR',
    price: 10250
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search query
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
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
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedPrice = parseFloat(price);
    const parsedQty = parseFloat(quantity);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price.');
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }
    if (!date) {
      setError('Please select a transaction date.');
      return;
    }

    onAddTransaction({
      symbol: symbol.toUpperCase(),
      type: 'BUY',
      price: parsedPrice,
      quantity: parsedQty,
      date
    });

    // Reset inputs
    setQuantity('10');
    setSearchQuery('');
    setError('');
  };

  const [activeModal, setActiveModal] = useState<'smartbuy' | 'fixport' | 'rebalance' | 'divstrat' | 'compounding' | null>(null);
  const [smartBuyBudget, setSmartBuyBudget] = useState('10000000');

  const currencyCode = selectedStockInfo?.currency || 'IDR';
  const currencySymbol = currencyCode === 'USD' ? '$' : 'Rp';

  // Dynamic 1-Year Dividend Gain Estimation
  const totalPortfolioValue = portfolio.reduce((acc, p) => acc + p.currentValue, 0);
  const estAnnualDividend = portfolio.reduce((acc, item) => {
    const yieldPct = item.symbol.endsWith('.JK') ? 0.048 : 0.018; // 4.8% for IDX, 1.8% for US stocks
    return acc + (item.currentValue * yieldPct);
  }, 0);
  const portfolioYieldPct = totalPortfolioValue > 0 ? (estAnnualDividend / totalPortfolioValue) * 100 : 0;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 pb-16 overflow-y-auto no-scrollbar md:ml-72">
      {/* Title Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Portfolio Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage positions, log transactions, and run algorithmic portfolio engines.</p>
        </div>

        {/* Feature Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModal('smartbuy')}
            className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Brain className="w-3.5 h-3.5" /> 🧠 Smart Buy
          </button>
          <button
            onClick={() => setActiveModal('fixport')}
            className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Fix Port
          </button>
          <button
            onClick={() => setActiveModal('rebalance')}
            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Rebalance
          </button>
          <button
            onClick={() => setActiveModal('divstrat')}
            className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <DollarSign className="w-3.5 h-3.5" /> 💰 Div Strategy
          </button>
          <button
            onClick={() => setActiveModal('compounding')}
            className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Flame className="w-3.5 h-3.5" /> Snowball Engine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Positions Summary Table (Left Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1-Year Dividend Gain Estimate Summary Banner */}
          {portfolio.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-emerald-950/60 border border-indigo-500/30 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-xl">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" /> 1-Year Dividend Gain Estimate
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {formatCurrency(estAnnualDividend, 'IDR')}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated based on current holding valuations (IDX: 4.8% yield | US: 1.8% yield)
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Weighted Portfolio Yield</span>
                <span className="text-lg font-bold text-indigo-300">{portfolioYieldPct.toFixed(2)}%</span>
              </div>
            </div>
          )}

          <div className="glass-panel rounded-2xl border-slate-800/85 overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-accent-cyan" />
                <h3 className="font-bold text-base text-slate-200">Active Positions</h3>
              </div>
              {portfolio.length > 0 && (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  Est. Annual Income: {formatCurrency(estAnnualDividend, 'IDR')}
                </span>
              )}
            </div>
            
            <div className="overflow-x-auto">
              {portfolio.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-950/20 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                      <th className="px-5 py-4">Ticker</th>
                      <th className="px-5 py-4">Shares</th>
                      <th className="px-5 py-4">Avg Price</th>
                      <th className="px-5 py-4">Market Price</th>
                      <th className="px-5 py-4">Cost Basis</th>
                      <th className="px-5 py-4">Current Value</th>
                      <th className="px-5 py-4 text-right">Returns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm">
                    {portfolio.map((item) => {
                      const isUp = item.totalGainLoss >= 0;
                      return (
                        <tr key={item.symbol} className="hover:bg-slate-900/10 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-200">{item.symbol}</td>
                          <td className="px-5 py-4 font-medium text-slate-300">{item.totalQuantity.toFixed(2)}</td>
                          <td className="px-5 py-4 text-slate-400">{formatCurrency(item.averageBuyPrice, item.currency)}</td>
                          <td className="px-5 py-4 text-slate-400">{formatCurrency(item.currentPrice, item.currency)}</td>
                          <td className="px-5 py-4 text-slate-400">{formatCurrency(item.totalCost, item.currency)}</td>
                          <td className="px-5 py-4 text-slate-300 font-semibold">{formatCurrency(item.currentValue, item.currency)}</td>
                          <td className={`px-5 py-4 text-right font-bold ${isUp ? 'text-accent-green' : 'text-accent-rose'}`}>
                            <div className="flex items-center justify-end gap-0.5">
                              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                              <span>{formatCurrency(Math.abs(item.totalGainLoss), item.currency)}</span>
                            </div>
                            <span className="text-xs font-semibold">({isUp ? '+' : '-'}{item.totalGainLossPercentage.toFixed(2)}%)</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-500 mb-2">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">No positions open</p>
                  <p className="text-xs text-slate-600 max-w-sm">
                    Open positions will populate automatically when transactions are logged on the right side.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="glass-panel rounded-2xl border-slate-800/85 overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center gap-2">
              <History className="h-5 w-5 text-accent-cyan" />
              <h3 className="font-bold text-base text-slate-200">Transaction History</h3>
            </div>
            
            <div className="overflow-x-auto max-h-80">
              {transactions.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-950/20 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                      <th className="px-5 py-3">Symbol</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Shares</th>
                      <th className="px-5 py-3">Price Paid</th>
                      <th className="px-5 py-3">Total Cost</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {transactions.slice().reverse().map((t) => {
                      const currency = t.symbol.toUpperCase().endsWith('.JK') ? 'IDR' : 'USD';
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-200">{t.symbol}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/20">
                              {t.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400">{t.date}</td>
                          <td className="px-5 py-3 text-slate-300">{t.quantity}</td>
                          <td className="px-5 py-3 text-slate-400">{formatCurrency(t.price, currency)}</td>
                          <td className="px-5 py-3 text-slate-400">{formatCurrency(t.price * t.quantity, currency)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => onDeleteTransaction(t.id)}
                              className="p-1 rounded text-slate-500 hover:text-accent-rose hover:bg-slate-800/50 transition-colors focus:outline-none"
                              title="Delete transaction entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-xs text-slate-600">
                  Transaction logs will be archived here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Transaction Form (Right Column) */}
        <div>
          <div className="glass-panel p-6 rounded-2xl border-slate-800/85 sticky top-6">
            <h3 className="font-bold text-lg text-slate-200 mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent-cyan" />
              <span>Record Buy Order</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Ticker</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search asset (e.g. BBRI, AAPL)..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-accent-cyan/80 text-sm"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent-cyan animate-spin" />
                  )}
                </div>

                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-50 backdrop-blur-md">
                    {searchResults.length > 0 ? (
                      searchResults.map((stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onClick={() => {
                            setSymbol(stock.symbol);
                            setSelectedStockInfo(stock);
                            if (stock.price !== undefined) {
                              setPrice(stock.price.toString());
                            }
                            setSearchQuery(stock.symbol);
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-900 text-left border-b border-slate-900 transition-colors"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-200">{stock.symbol}</div>
                            <div className="text-[10px] text-slate-500 max-w-[150px] truncate">{stock.name}</div>
                          </div>
                          <div className="text-right text-xs">
                            <span className="font-bold text-slate-300">
                              {stock.price !== undefined ? formatCurrency(stock.price, stock.currency) : 'N/A'}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2.5 text-[11px] text-slate-500">
                        {searchQuery.trim().length < 2 ? 'Type to search Yahoo Finance...' : 'No assets found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>Ticker Selected</span>
                  <span className="text-accent-cyan">{symbol}</span>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex justify-between items-center">
                  <span className="font-bold text-slate-200">{symbol}</span>
                  <span className="text-[10px] text-slate-500">{selectedStockInfo?.name || 'Selected'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Price Paid ({currencyCode})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-accent-cyan/80 text-sm"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-accent-cyan/80 text-sm"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-accent-cyan/80 text-sm"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-accent-cyan to-accent-blue hover:from-accent-cyan/90 hover:to-accent-blue/90 border border-accent-cyan/20 rounded-xl text-background font-bold text-sm shadow-lg shadow-accent-cyan/15 hover:shadow-accent-cyan/25 transition-all duration-300 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5 stroke-[3px]" />
                Log Position
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODALS SECTION */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {activeModal === 'smartbuy' && <><Brain className="w-5 h-5 text-emerald-400" /> 🧠 Smart Buy Capital Allocator</>}
                {activeModal === 'fixport' && <><ShieldAlert className="w-5 h-5 text-rose-400" /> 🛡️ Fix Port Diagnostic Audit</>}
                {activeModal === 'rebalance' && <><RefreshCw className="w-5 h-5 text-blue-400" /> ⚖️ Portfolio Rebalancer Engine</>}
                {activeModal === 'divstrat' && <><DollarSign className="w-5 h-5 text-indigo-400" /> 💰 Dividend Strategy Matrix</>}
                {activeModal === 'compounding' && <><Flame className="w-5 h-5 text-amber-400" /> ⚡ Dividend Compounding Snowball</>}
              </h2>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Buy Body */}
            {activeModal === 'smartbuy' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Available Fresh Capital Budget (Rp)</label>
                  <input
                    type="number"
                    value={smartBuyBudget}
                    onChange={(e) => setSmartBuyBudget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Recommended Allocation Strategy</h4>
                  {portfolio.length > 0 ? (
                    portfolio.map((item, idx) => {
                      const budgetNum = parseFloat(smartBuyBudget) || 10000000;
                      const allocPct = idx === 0 ? 0.4 : idx === 1 ? 0.35 : 0.25 / (portfolio.length - 2 || 1);
                      const allocAmount = Math.round(budgetNum * allocPct);
                      const estShares = (allocAmount / item.currentPrice).toFixed(0);
                      return (
                        <div key={item.symbol} className="flex justify-between items-center bg-slate-900/60 p-3 rounded-lg text-xs">
                          <div>
                            <span className="font-bold text-slate-200">{item.symbol}</span>
                            <div className="text-[11px] text-slate-400">Buy ~{estShares} shares</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">{formatCurrency(allocAmount, 'IDR')}</span>
                            <div className="text-[10px] text-slate-500">{(allocPct * 100).toFixed(0)}% weight</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">Log active positions to calculate smart buy allocation.</p>
                  )}
                </div>
              </div>
            )}

            {/* Fix Port Body */}
            {activeModal === 'fixport' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Automated diagnostic audit scanning positions for stop-loss risks, overconcentration, or margin drag.</p>
                
                <div className="space-y-2">
                  {portfolio.length > 0 ? (
                    portfolio.map((item) => {
                      const isHighLoss = item.totalGainLossPercentage < -5;
                      let action = 'HOLD';
                      let reason = 'Position operating within healthy risk boundaries.';
                      let badgeColor = 'bg-slate-800 text-slate-300';

                      if (isHighLoss) {
                        action = 'AVERAGE_BUY / CUT_LOSS';
                        reason = 'Loss exceeds -5%. Check RSI oversold confirmation for rebound or trim position.';
                        badgeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                      } else if (item.totalGainLossPercentage > 10) {
                        action = 'TAKE_PROFIT';
                        reason = 'Gain exceeds +10%. Lock in partial profits.';
                        badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                      }

                      return (
                        <div key={item.symbol} className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                              {item.symbol}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>{action}</span>
                            </div>
                            <p className="text-slate-400">{reason}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No active positions to audit. Add a position to run diagnostics.</p>
                  )}
                </div>
              </div>
            )}

            {/* Rebalance Body */}
            {activeModal === 'rebalance' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Compares actual position weights against equal-weighted model targets.</p>
                <div className="space-y-3">
                  {portfolio.length > 0 ? (
                    portfolio.map((item) => {
                      const totalVal = portfolio.reduce((acc, p) => acc + p.currentValue, 0);
                      const actualPct = totalVal > 0 ? (item.currentValue / totalVal) * 100 : 0;
                      const targetPct = 100 / portfolio.length;
                      const diffPct = actualPct - targetPct;

                      return (
                        <div key={item.symbol} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between font-bold text-slate-200">
                            <span>{item.symbol}</span>
                            <span>Actual: {actualPct.toFixed(1)}% | Target: {targetPct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(actualPct, 100)}%` }} />
                          </div>
                          <div className="text-right font-semibold text-slate-400">
                            {diffPct > 2 ? <span className="text-amber-400">Overweight: Trim ~{diffPct.toFixed(1)}%</span> :
                             diffPct < -2 ? <span className="text-emerald-400">Underweight: Add ~{Math.abs(diffPct).toFixed(1)}%</span> :
                             <span className="text-slate-500">Balanced</span>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No active positions to rebalance.</p>
                  )}
                </div>
              </div>
            )}

            {/* Div Strategy Body */}
            {activeModal === 'divstrat' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-xs text-slate-400">Est. 1-Year Dividend Gain</span>
                    <div className="text-xl font-extrabold text-emerald-400 mt-1">
                      {formatCurrency(estAnnualDividend, 'IDR')}
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-xs text-slate-400">Portfolio Dividend Yield</span>
                    <div className="text-xl font-extrabold text-indigo-400 mt-1">
                      {portfolioYieldPct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Quarterly Payout Schedule</h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500">Q1 (20%)</span>
                      <div className="font-bold text-slate-200 mt-0.5">{formatCurrency(estAnnualDividend * 0.20, 'IDR')}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500">Q2 (30%)</span>
                      <div className="font-bold text-slate-200 mt-0.5">{formatCurrency(estAnnualDividend * 0.30, 'IDR')}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500">Q3 (22%)</span>
                      <div className="font-bold text-slate-200 mt-0.5">{formatCurrency(estAnnualDividend * 0.22, 'IDR')}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <span className="text-slate-500">Q4 (28%)</span>
                      <div className="font-bold text-slate-200 mt-0.5">{formatCurrency(estAnnualDividend * 0.28, 'IDR')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Compounding Snowball Body */}
            {activeModal === 'compounding' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">Snowball Reinvestment Target Recommendations for dividend payouts.</p>
                <div className="space-y-2">
                  <div className="bg-slate-950/60 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                        <Flame className="w-4 h-4" /> Reinvest Payouts in BBRI.JK / BBCA.JK
                      </div>
                      <p className="text-slate-400 mt-1">5.9% yield with strong cash flow compound potential.</p>
                    </div>
                    <span className="font-bold text-emerald-400 text-sm">+8.2% Compounding APY</span>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-800 pt-4 text-right">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
