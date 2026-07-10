import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  History,
  Search,
  Loader2
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
  const [symbol, setSymbol] = useState('AAPL');
  const [price, setPrice] = useState('189.84');
  const [quantity, setQuantity] = useState('10');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStockInfo, setSelectedStockInfo] = useState<any>({
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currency: 'USD',
    price: 189.84
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

  const currencyCode = selectedStockInfo?.currency || (symbol.endsWith('.JK') ? 'IDR' : 'USD');
  const currencySymbol = currencyCode === 'IDR' ? 'Rp' : '$';

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 pb-16 overflow-y-auto no-scrollbar md:ml-72">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Portfolio Tracker
        </h1>
        <p className="text-slate-400 text-sm mt-1">Manage positions, log transactions, and track average cost basis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Positions Summary Table (Left Columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border-slate-800/85 overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent-cyan" />
              <h3 className="font-bold text-base text-slate-200">Active Positions</h3>
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
    </div>
  );
}
