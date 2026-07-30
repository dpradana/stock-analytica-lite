import { useState } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  PieChart, 
  Menu, 
  X,
  Sparkles,
  Target,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import { ActiveTab } from '../types/stock';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user?: any;
  onOpenAuth?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, user, onOpenAuth, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis' as ActiveTab, label: 'Stock Analysis', icon: TrendingUp },
    { id: 'portfolio' as ActiveTab, label: 'Portfolio Tracker', icon: Briefcase },
    { id: 'risk' as ActiveTab, label: 'Risk & Allocations', icon: PieChart },
    { id: 'screeners' as ActiveTab, label: 'Stock Screeners', icon: Target },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 glass-panel border-b border-card-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-accent-cyan to-accent-blue rounded-lg shadow-md shadow-accent-cyan/20">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-accent-cyan bg-clip-text text-transparent">
            StockAnalytica <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full text-accent-cyan ml-0.5">Lite</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Mobile Auth Button */}
          {user ? (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-rose-400 transition-colors"
            >
              <div className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
              </div>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors focus:outline-none"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Overlay Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/95 backdrop-blur-xl flex flex-col justify-between p-6 pt-20">
          <nav className="flex flex-col gap-3">
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
                  className={`flex items-center gap-3.5 py-3.5 px-5 rounded-xl border text-base font-medium transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-accent-cyan/15 to-accent-blue/10 border-accent-cyan/30 text-accent-cyan shadow-lg shadow-accent-cyan/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-accent-cyan' : ''}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Auth Widget in Mobile Overlay */}
          <div className="pt-6 border-t border-slate-800/80 space-y-3">
            {user ? (
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-sm">
                    {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate text-left">
                    <div className="text-sm font-bold text-slate-200 truncate">{user.display_name || user.username}</div>
                    <div className="text-xs text-emerald-400 font-semibold">{user.role || 'Authorized User'}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  setIsOpen(false);
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In / Authorized Login
              </button>
            )}
          </div>
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

        <div className="mt-auto pt-6 border-t border-slate-800/60 space-y-3">
          {user ? (
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 max-w-[150px]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 font-bold text-xs">
                  {(user.display_name || user.username || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <div className="text-xs font-bold text-slate-200 truncate">{user.display_name || user.username}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">{user.role || 'Authorized'}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600/20 to-emerald-500/20 hover:from-indigo-600/30 hover:to-emerald-500/30 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              Google / Email Login
            </button>
          )}

          <div className="px-3 py-2 bg-slate-900/40 rounded-xl border border-slate-800/60 text-center">
            <p className="text-[10px] text-slate-500 font-medium">REAL-TIME STOCK ANALYTICA</p>
          </div>
        </div>
      </aside>
    </>
  );
}
