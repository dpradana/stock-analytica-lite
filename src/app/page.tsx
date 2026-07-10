"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ActiveTab, Transaction, PortfolioItem, IndexInfo } from '../types/stock';
import { SUPPORTED_TICKERS, getMockMarketIndices, simulatePriceUpdate } from '../utils/mockMarket';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import StockAnalysis from '../components/StockAnalysis';
import PortfolioTracker from '../components/PortfolioTracker';
import RiskAllocations from '../components/RiskAllocations';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedAnalysisSymbol, setSelectedAnalysisSymbol] = useState('AAPL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [portfolioHistories, setPortfolioHistories] = useState<Record<string, number[]>>({});

  // Live prices state initialized with default ticker prices
  const [livePrices, setLivePrices] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.values(SUPPORTED_TICKERS).forEach(s => {
      initial[s.symbol] = s.price;
    });
    return initial;
  });

  const defaultSymbols = useMemo(() => [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'JPM', 'V', 'JNJ', 'LLY',
    'BBRI.JK', 'TLKM.JK', 'BBCA.JK', 'BMRI.JK', 'ASII.JK',
    'SPY', 'QQQ', '^JKSE'
  ], []);

  const activeSymbols = useMemo(() => {
    const txSymbols = transactions.map(t => t.symbol);
    return Array.from(new Set([...defaultSymbols, ...txSymbols, selectedAnalysisSymbol]));
  }, [transactions, selectedAnalysisSymbol, defaultSymbols]);

  // Fetch live quotes helper
  const fetchLiveQuotes = async (symbolsToFetch: string[]) => {
    if (symbolsToFetch.length === 0) return;
    try {
      const res = await fetch(`/api/stock/quote?symbols=${symbolsToFetch.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        if (data.quotes) {
          setQuotes(prev => ({
            ...prev,
            ...data.quotes
          }));
          
          setLivePrices(prev => {
            const next = { ...prev };
            Object.keys(data.quotes).forEach(sym => {
              next[sym] = data.quotes[sym].price;
            });
            return next;
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch live quotes:", error);
    }
  };

  // Client-side hydration safety + initial seed data
  useEffect(() => {
    const runOnMount = () => {
      setIsMounted(true);
      setIndices(getMockMarketIndices());
      
      const saved = localStorage.getItem('stock_analytica_transactions');
      if (saved) {
        try {
          setTransactions(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse transactions", e);
        }
      } else {
        // Premium initial mock data so the screen isn't empty!
        const defaultTx: Transaction[] = [
          { id: 'tx-1', symbol: 'AAPL', type: 'BUY', price: 182.30, quantity: 15, date: '2026-03-10' },
          { id: 'tx-2', symbol: 'MSFT', type: 'BUY', price: 412.50, quantity: 8, date: '2026-04-15' },
          { id: 'tx-3', symbol: 'NVDA', type: 'BUY', price: 885.00, quantity: 6, date: '2026-05-20' },
          { id: 'tx-4', symbol: 'GOOGL', type: 'BUY', price: 172.10, quantity: 12, date: '2026-06-01' }
        ];
        setTransactions(defaultTx);
        localStorage.setItem('stock_analytica_transactions', JSON.stringify(defaultTx));
      }
    };

    const timeoutId = setTimeout(runOnMount, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // Poll live quotes periodically
  useEffect(() => {
    if (!isMounted) return;

    fetchLiveQuotes(activeSymbols);

    const timer = setInterval(() => {
      fetchLiveQuotes(activeSymbols);
    }, 15000);

    return () => clearInterval(timer);
  }, [isMounted, activeSymbols]);

  // Update index details from live quotes
  useEffect(() => {
    if (Object.keys(quotes).length === 0) return;
    setIndices(prev => {
      return prev.map(idx => {
        const quote = quotes[idx.symbol];
        if (quote) {
          const price = quote.price;
          const change = quote.change;
          const changePercent = quote.changePercent;
          return {
            ...idx,
            price,
            change,
            changePercent,
            history: idx.history[idx.history.length - 1] === price ? idx.history : [...idx.history.slice(1), price],
            currency: quote.currency
          };
        }
        return idx;
      });
    });
  }, [quotes]);

  // Aggregate/Recalculate portfolio dynamically using live updating prices
  const portfolio: PortfolioItem[] = useMemo(() => {
    const holdings: Record<string, { qty: number; cost: number }> = {};
    
    transactions.forEach(t => {
      if (!holdings[t.symbol]) {
        holdings[t.symbol] = { qty: 0, cost: 0 };
      }
      const h = holdings[t.symbol];
      if (t.type === 'BUY') {
        h.qty += t.quantity;
        h.cost += t.price * t.quantity;
      }
    });

    return Object.entries(holdings)
      .filter((entry) => entry[1].qty > 0)
      .map(([symbol, data]) => {
        const quote = quotes[symbol];
        const currentPrice = quote?.price || livePrices[symbol] || SUPPORTED_TICKERS[symbol]?.price || (data.cost / data.qty);
        const currentValue = data.qty * currentPrice;
        const averageBuyPrice = data.cost / data.qty;
        const totalCost = data.cost;
        const totalGainLoss = currentValue - totalCost;
        const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
        const currency = quote?.currency || (symbol.endsWith('.JK') ? 'IDR' : 'USD');
        const sector = quote?.sector || SUPPORTED_TICKERS[symbol]?.sector || (symbol.toUpperCase().endsWith('.JK') ? 'Financial Services' : 'Other');
        const beta = quote?.beta !== undefined && quote?.beta !== null ? quote.beta : (SUPPORTED_TICKERS[symbol]?.beta !== undefined ? SUPPORTED_TICKERS[symbol].beta : 1.0);
        
        return {
          symbol,
          totalQuantity: data.qty,
          totalCost,
          averageBuyPrice,
          currentPrice,
          currentValue,
          totalGainLoss,
          totalGainLossPercentage,
          currency,
          sector,
          beta
        };
      });
  }, [transactions, livePrices, quotes]);

  // Fetch portfolio histories when positions change
  useEffect(() => {
    if (!isMounted || portfolio.length === 0) return;

    const fetchHistories = async () => {
      const newHistories = { ...portfolioHistories };
      let changed = false;

      await Promise.all(
        portfolio.map(async (item) => {
          if (newHistories[item.symbol]) return; // Already fetched

          try {
            const res = await fetch(`/api/stock/history?symbol=${item.symbol}&interval=1M`);
            if (res.ok) {
              const data = await res.json();
              if (data.data && Array.isArray(data.data)) {
                newHistories[item.symbol] = data.data.map((pt: any) => pt.close);
                changed = true;
              }
            }
          } catch (e) {
            console.error(`Failed to fetch history for ${item.symbol}`, e);
          }
        })
      );

      if (changed) {
        setPortfolioHistories(newHistories);
      }
    };

    fetchHistories();
  }, [portfolio, isMounted]);

  // Recalculate the portfolio value over time (1M index values)
  const portfolioHistory = useMemo(() => {
    const pointsCount = 30;
    const history: { date: string; value: number }[] = [];
    const now = new Date();

    if (portfolio.length === 0) {
      // Upward trend placeholder curve
      for (let i = pointsCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const val = 12000 + Math.sin(i * 0.15) * 400 + (pointsCount - i) * 120;
        history.push({
          date: d.toLocaleDateString([], { month: 'short', day: '2-digit' }),
          value: Number(val.toFixed(2))
        });
      }
      return history;
    }

    // Prepare history generator for each symbol
    const baseHistories: Record<string, number[]> = {};

    portfolio.forEach(item => {
      // Use fetched history if available, otherwise fill with current price
      const fetched = portfolioHistories[item.symbol];
      if (fetched && fetched.length > 0) {
        // Pad or slice history to match pointsCount
        let prices = [...fetched];
        if (prices.length < pointsCount) {
          const diff = pointsCount - prices.length;
          const padding = new Array(diff).fill(prices[0] || item.currentPrice);
          prices = [...padding, ...prices];
        } else if (prices.length > pointsCount) {
          prices = prices.slice(prices.length - pointsCount);
        }
        baseHistories[item.symbol] = prices;
      } else {
        // Fallback: fill with currentPrice
        baseHistories[item.symbol] = new Array(pointsCount).fill(item.currentPrice);
      }
    });

    for (let i = 0; i < pointsCount; i++) {
      let dailySum = 0;
      portfolio.forEach(item => {
        const sequence = baseHistories[item.symbol];
        const dayPrice = sequence && sequence[i] !== undefined ? sequence[i] : item.currentPrice;
        dailySum += dayPrice * item.totalQuantity;
      });

      const dateCopy = new Date(now.getTime());
      dateCopy.setDate(now.getDate() - (pointsCount - 1 - i));
      const dateStr = dateCopy.toLocaleDateString([], { month: 'short', day: '2-digit' });

      history.push({
        date: dateStr,
        value: Number(dailySum.toFixed(2))
      });
    }

    return history;
  }, [portfolio, portfolioHistories]);


  // CRUD positions handlers
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    const updated = [...transactions, transaction];
    setTransactions(updated);
    localStorage.setItem('stock_analytica_transactions', JSON.stringify(updated));
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem('stock_analytica_transactions', JSON.stringify(updated));
  };

  const handleNavigateToAnalysis = (ticker: string) => {
    setSelectedAnalysisSymbol(ticker);
    setActiveTab('analysis');
  };

  // Prevent flash or SSR layout mismatches
  if (!isMounted) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-[#030712]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-xl border border-accent-cyan/30 flex items-center justify-center font-bold text-accent-cyan pulse-glow-active">
            SA
          </div>
          <span className="text-sm font-semibold text-slate-500">Initializing StockAnalytica...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative overflow-hidden bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'dashboard' && (
          <Dashboard 
            portfolio={portfolio} 
            indices={indices} 
            portfolioHistory={portfolioHistory}
            onNavigateToAnalysis={handleNavigateToAnalysis}
            quotes={quotes}
          />
        )}
        
        {activeTab === 'analysis' && (
          <StockAnalysis 
            key={selectedAnalysisSymbol}
            initialSymbol={selectedAnalysisSymbol} 
            livePrices={livePrices}
          />
        )}
        
        {activeTab === 'portfolio' && (
          <PortfolioTracker 
            transactions={transactions}
            portfolio={portfolio}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
        
        {activeTab === 'risk' && (
          <RiskAllocations 
            portfolio={portfolio}
          />
        )}
      </main>
    </div>
  );
}
