import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Gauge, 
  Info,
  Layers
} from 'lucide-react';
import { PortfolioItem } from '../types/stock';
import { formatCurrency } from '../utils/stockUtils';

interface RiskAllocationsProps {
  portfolio: PortfolioItem[];
}

const COLORS = [
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a78bfa', // Purple
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#10b981', // Emerald
  '#eab308', // Yellow
  '#ec4899', // Pink
  '#14b8a6'  // Teal
];

export default function RiskAllocations({ portfolio }: RiskAllocationsProps) {
  // Aggregate portfolio stats converting to target currency (IDR vs USD)
  const totalValue = portfolio.reduce((sum, item) => sum + item.currentValue, 0);
  
  // Calculate weights and portfolio Beta
  const weightedBeta = portfolio.reduce((sum, item) => {
    const beta = item.beta !== undefined ? item.beta : 1.0;
    const weight = totalValue > 0 ? item.currentValue / totalValue : 0;
    return sum + (beta * weight);
  }, 0);

  // Group by sector
  const sectorDataMap: Record<string, number> = {};
  portfolio.forEach((item) => {
    const sector = item.sector || 'Other';
    sectorDataMap[sector] = (sectorDataMap[sector] || 0) + item.currentValue;
  });

  const sectorChartData = Object.entries(sectorDataMap).map(([name, value]) => ({
    name,
    value
  }));

  const pieChartData = portfolio.map((item) => ({
    name: item.symbol,
    value: item.currentValue,
    currency: item.currency
  }));

  // Define Beta rating
  let betaRating = 'Neutral';
  let betaIcon = ShieldCheck;
  let betaColorClass = 'text-accent-green';
  let betaDescription = 'Your portfolio volatility matches the S&P 500 index. Stable growth profile.';

  if (weightedBeta > 1.2) {
    betaRating = 'High Volatility';
    betaIcon = AlertTriangle;
    betaColorClass = 'text-accent-rose';
    betaDescription = 'Aggressive growth profile. Volatility is higher than the general market, amplifying potential returns and losses.';
  } else if (weightedBeta < 0.85 && weightedBeta > 0) {
    betaRating = 'Conservative';
    betaIcon = ShieldCheck;
    betaColorClass = 'text-accent-cyan';
    betaDescription = 'Defensive profile. Volatility is lower than the market, buffering losses during market corrections.';
  } else if (weightedBeta === 0) {
    betaRating = 'No Beta Data';
    betaDescription = 'Log asset purchase transactions to generate risk analysis profiles.';
  }

  const BetaIconComponent = betaIcon;

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 pb-16 overflow-y-auto no-scrollbar md:ml-72">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Risk & Allocations
        </h1>
        <p className="text-slate-400 text-sm mt-1">Diversification check, asset concentration, and beta profile estimations.</p>
      </div>

      {portfolio.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Volatility & Sector Weights */}
          <div className="space-y-6">
            {/* Beta Gauge Meter */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800/85 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 w-32 h-32 rounded-full border border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center relative overflow-hidden">
                <Gauge className={`h-8 w-8 mb-1.5 ${betaColorClass}`} />
                <span className="text-2xl font-extrabold text-white">{weightedBeta.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portfolio Beta</span>
              </div>
              <div className="space-y-2 flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <BetaIconComponent className={`h-5 w-5 ${betaColorClass}`} />
                  <h3 className="font-extrabold text-lg text-slate-200">Risk Profile: <span className={betaColorClass}>{betaRating}</span></h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{betaDescription}</p>
                <div className="pt-2 flex items-center justify-center md:justify-start gap-1 text-[10px] text-slate-500 font-semibold">
                  <Info className="h-3.5 w-3.5" />
                  <span>Market standard benchmark Beta = 1.00 (S&P 500 ETF)</span>
                </div>
              </div>
            </div>

            {/* Asset Allocation Weights Table */}
            <div className="glass-panel rounded-2xl border-slate-800/85 overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex items-center gap-2">
                <Layers className="h-5 w-5 text-accent-cyan" />
                <h3 className="font-bold text-base text-slate-200">Asset Weight Distributions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/50 bg-slate-950/20 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                      <th className="px-5 py-3.5">Asset</th>
                      <th className="px-5 py-3.5">Sector</th>
                      <th className="px-5 py-3.5">Beta</th>
                      <th className="px-5 py-3.5 text-right">Value</th>
                      <th className="px-5 py-3.5 text-right">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm">
                    {portfolio.map((item) => {
                      const beta = item.beta !== undefined ? item.beta : 1.0;
                      const sector = item.sector || 'Other';
                      const weightPercent = (item.currentValue / totalValue) * 100;
                      return (
                        <tr key={item.symbol} className="hover:bg-slate-900/10 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-200">{item.symbol}</td>
                          <td className="px-5 py-3.5 text-xs text-slate-400">{sector}</td>
                          <td className="px-5 py-3.5 text-slate-400 font-medium">{beta.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-right font-medium text-slate-300">
                            {formatCurrency(item.currentValue, item.currency)}
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-accent-cyan">
                            {weightPercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Pie Charts */}
          <div className="space-y-6">
            {/* Asset Diversification Pie */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800/85 h-[340px] flex flex-col">
              <h3 className="font-bold text-base text-slate-200 mb-2">Portfolio Diversification (Assets)</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, props: any) => {
                        const currency = props?.payload?.currency || 'USD';
                        return [formatCurrency(Number(val), currency), 'Value'];
                      }}
                      contentStyle={{ backgroundColor: '#0b1528', borderColor: '#1e293b' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      iconSize={10} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sector Diversification Pie */}
            <div className="glass-panel p-6 rounded-2xl border-slate-800/85 h-[340px] flex flex-col">
              <h3 className="font-bold text-base text-slate-200 mb-2">Sector Weight Concentration</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={0}
                      outerRadius={75}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {sectorChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      // Format using target currency check: if portfolio contains IDR, format sector as IDR
                      formatter={(val: any) => [formatCurrency(Number(val), portfolio.some(x => x.currency === 'IDR') ? 'IDR' : 'USD'), 'Concentration']}
                      contentStyle={{ backgroundColor: '#0b1528', borderColor: '#1e293b' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      iconSize={10} 
                      iconType="rect"
                      wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-16 rounded-2xl border-slate-800/85 text-center flex flex-col items-center justify-center space-y-3 max-w-2xl mx-auto">
          <div className="p-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl shadow-inner">
            <Gauge className="h-8 w-8" />
          </div>
          <h3 className="font-extrabold text-lg text-slate-300">Risk Assessment Locked</h3>
          <p className="text-sm text-slate-400 max-w-md">
            This module requires purchase records to compute metrics. Open the **Portfolio Tracker** tab and add positions to unlock.
          </p>
        </div>
      )}
    </div>
  );
}
