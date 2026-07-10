import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  PieChart, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from '../types/stock';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis' as ActiveTab, label: 'Stock Analysis', icon: TrendingUp },
    { id: 'portfolio' as ActiveTab, label: 'Portfolio Tracker', icon: Briefcase },
    { id: 'risk' as ActiveTab, label: 'Risk & Allocations', icon: PieChart },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 glass-panel border-b border-card-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-accent-cyan to-accent-blue rounded-lg shadow-md shadow-accent-cyan/20">
            <Sparkles className="h-5 w-5 text-background" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-accent-cyan bg-clip-text text-transparent">
            StockAnalytica <span className="text-xs font-semibold px-2 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full text-accent-cyan ml-1">Lite</span>
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Overlay Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/85 backdrop-blur-md flex flex-col justify-center px-8">
          <nav className="flex flex-col gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-4 py-4 px-6 rounded-xl border text-lg font-medium transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-accent-cyan/15 to-accent-blue/10 border-accent-cyan/30 text-accent-cyan shadow-lg shadow-accent-cyan/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'text-accent-cyan' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen glass-panel border-r border-card-border p-6 fixed left-0 top-0 z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="p-2 bg-gradient-to-tr from-accent-cyan to-accent-blue rounded-xl shadow-lg shadow-accent-cyan/25">
            <Sparkles className="h-6 w-6 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg leading-tight tracking-tight bg-gradient-to-r from-white via-slate-100 to-accent-cyan bg-clip-text text-transparent">
              StockAnalytica
            </span>
            <span className="text-xs font-semibold text-accent-cyan/90 flex items-center gap-1 mt-0.5">
              LITE EDITION
            </span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 py-3.5 px-4 rounded-xl border text-sm font-medium transition-all duration-300 relative overflow-hidden group ${
                  isActive 
                    ? 'bg-gradient-to-r from-accent-cyan/15 to-accent-blue/10 border-accent-cyan/30 text-accent-cyan shadow-md shadow-accent-cyan/5' 
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40 hover:border-slate-800'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-cyan to-accent-blue rounded-r-md" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-accent-cyan' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800/60 text-center">
          <div className="px-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <p className="text-[11px] text-slate-500 font-medium">REAL-TIME SIMULATED DATA</p>
            <p className="text-[10px] text-accent-cyan/60 mt-1">Portfolio persists in LocalStorage</p>
          </div>
        </div>
      </aside>
    </>
  );
}
