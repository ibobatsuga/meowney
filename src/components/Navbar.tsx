import React from 'react';
import { 
  Home, 
  Settings2, 
  PlusCircle, 
  LayoutDashboard, 
  Wallet, 
  CheckCircle2, 
  FileText, 
  CalendarRange, 
  HeartHandshake, 
  BadgePercent, 
  PiggyBank, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { formatMonthYear, formatIDR } from '../utils/formatters';

export type NavTab = 
  | 'welcome'
  | 'setup'
  | 'input'
  | 'dashboard'
  | 'pockets'
  | 'rekap'
  | 'reports'
  | 'annual'
  | 'reflection'
  | 'debts'
  | 'assets'
  | 'guide'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  safeDailySpend: number;
  totalLiquidBalance: number;
  hasSetup: boolean;
  onLockApp?: () => void;
  isGateEnabled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedMonth,
  onMonthChange,
  safeDailySpend,
  totalLiquidBalance,
  hasSetup,
  onLockApp,
  isGateEnabled
}) => {
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonthStr);
  };

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'welcome', label: 'Selamat Datang', icon: <Home className="w-4 h-4" /> },
    { id: 'setup', label: 'Setup Awal', icon: <BadgePercent className="w-4 h-4" />, badge: !hasSetup ? 'Setup Dulu' : undefined },
    { id: 'input', label: 'Input Harian', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'pockets', label: 'Kantong Uang', icon: <Wallet className="w-4 h-4" /> },
    { id: 'rekap', label: 'Rekap & Reality Check', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'reports', label: 'Laporan', icon: <FileText className="w-4 h-4" /> },
    { id: 'annual', label: 'Tahunan', icon: <CalendarRange className="w-4 h-4" /> },
    { id: 'reflection', label: 'Refleksi', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'debts', label: 'Hutang Piutang', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'assets', label: 'Aset & Kekayaan', icon: <PiggyBank className="w-4 h-4" /> },
    { id: 'guide', label: 'Panduan Lengkap', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings2 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand with Lucky Cat JS */}
          <div 
            onClick={() => onTabChange(hasSetup ? 'dashboard' : 'welcome')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-red-600 p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <img 
                src="/lucky-cat.png" 
                alt="Lucky Cat JS Logo" 
                className="w-full h-full object-contain rounded-2xl bg-white"
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-stone-900 via-stone-800 to-rose-700 bg-clip-text text-transparent">
                  Meowney
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 tracking-wider uppercase">
                  Sandwich
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Perencanaan Anggaran Generasi Sandwich
              </p>
            </div>
          </div>

          {/* Center: Month Navigator */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={handlePrevMonth}
              title="Bulan sebelumnya"
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs sm:text-sm font-semibold text-stone-800">
              {formatMonthYear(selectedMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              title="Bulan berikutnya"
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Metrics: Safe Daily Spend & Liquid Balance */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider flex items-center justify-end gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                Batas Harian Aman
              </span>
              <span className="text-xs font-bold text-amber-700">
                {safeDailySpend > 0 ? `${formatIDR(safeDailySpend)}/hari` : 'Rp 0/hari'}
              </span>
            </div>

            <div className="hidden lg:flex flex-col text-right pl-3 border-l border-stone-200">
              <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                Total Saldo Kas
              </span>
              <span className={`text-xs font-bold ${totalLiquidBalance >= 0 ? 'text-stone-800' : 'text-rose-600'}`}>
                {formatIDR(totalLiquidBalance)}
              </span>
            </div>

            {isGateEnabled && onLockApp && (
              <button
                onClick={onLockApp}
                title="Kunci Planner"
                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
              >
                🔒
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Horizontal Scrollable Tabs */}
      <div className="border-t border-stone-100 bg-stone-50/70 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 py-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 font-bold ml-1 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
