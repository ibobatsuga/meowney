import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Flame, 
  Smile, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  PlusCircle,
  PiggyBank,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import type { 
  Transaction, 
  BudgetSetup, 
  Pocket, 
  Asset, 
  DebtLoan 
} from '../types';
import { 
  formatIDR, 
  formatMonthYear 
} from '../utils/formatters';
import { 
  calculateMonthlySummary, 
  calculatePlanVsActual, 
  calculateSafeDailySpend,
  calculateNetWorth,
  calculatePocketBalances
} from '../utils/calculator';
import { MOODS } from '../db';

interface DashboardSectionProps {
  currentMonth: string;
  setup?: BudgetSetup;
  transactions: Transaction[];
  pockets: Pocket[];
  assets: Asset[];
  debts: DebtLoan[];
  onNavigate: (tab: any) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  currentMonth,
  setup,
  transactions,
  pockets,
  assets,
  debts,
  onNavigate
}) => {
  const summary = calculateMonthlySummary(transactions, currentMonth);
  const planVsActual = calculatePlanVsActual(setup, summary.expenseByCategory);
  const safeDaily = calculateSafeDailySpend(setup, summary.totalExpense);

  const pocketBalances = calculatePocketBalances(pockets, transactions);
  let totalLiquid = 0;
  for (const p of pocketBalances.values()) {
    totalLiquid += p.balance;
  }
  const netWorthData = calculateNetWorth(assets, debts, totalLiquid);

  const hasAnyTransactions = summary.transactionCount > 0;

  // Emotional spending metrics
  const moodList = Object.entries(summary.expenseByMood).sort((a, b) => b[1].total - a[1].total);

  // Over-budget categories
  const overBudgetCategories = planVsActual.filter(c => c.isOverBudget);
  const warningCategories = planVsActual.filter(c => c.isOverWarning);

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Month Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Dashboard Keuangan
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {formatMonthYear(currentMonth)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Pantau arus kas, batas aman belanja harian, dan kesehatan anggaran keluarga Anda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('input')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Warnings & Alerts (FR-20) */}
      {overBudgetCategories.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <span>Perhatian: Ada {overBudgetCategories.length} Pos Melebihi Anggaran Rencana!</span>
          </div>
          <p className="text-xs text-rose-700">
            Pos yang terlampaui: {overBudgetCategories.map(c => `${c.category} (lebih ${formatIDR(Math.abs(c.diff))})`).join(', ')}.
          </p>
        </div>
      )}

      {warningCategories.length > 0 && overBudgetCategories.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <span>Mendekati Batas: {warningCategories.length} Pos Sudah Terpakai di Atas 80%</span>
          </div>
          <p className="text-xs text-amber-700">
            Pos: {warningCategories.map(c => `${c.category} (${c.percentUsed}%)`).join(', ')}.
          </p>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pemasukan */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-900">
            {formatIDR(summary.totalIncome)}
          </p>
          <p className="text-[11px] text-stone-400">
            Target rencana: {formatIDR(setup?.income || 0)}
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-900">
            {formatIDR(summary.totalExpense)}
          </p>
          <p className="text-[11px] text-stone-400">
            {safeDaily.totalPlannedBudget > 0 
              ? `${safeDaily.percentUsed}% dari total alokasi ${formatIDR(safeDaily.totalPlannedBudget)}`
              : 'Alokasi belum diset'}
          </p>
        </div>

        {/* Safe Daily Spend (FR-25) */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Safe Daily Spend
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              safeDaily.status === 'melewati' ? 'bg-rose-200 text-rose-800' :
              safeDaily.status === 'mendekati' ? 'bg-amber-200 text-amber-900' :
              'bg-emerald-200 text-emerald-800'
            }`}>
              {safeDaily.status.toUpperCase()}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-900">
            {safeDaily.safeDailyAmount > 0 ? `${formatIDR(safeDaily.safeDailyAmount)}/hari` : 'Rp 0/hari'}
          </p>
          <p className="text-[11px] text-amber-800">
            Sisa {safeDaily.remainingDays} hari • Sisa budget: {formatIDR(safeDaily.remainingBudget)}
          </p>
        </div>

        {/* Net Worth & Liquid Balance */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-bold uppercase tracking-wider">Kekayaan Bersih</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-900">
            {formatIDR(netWorthData.netWorth)}
          </p>
          <p className="text-[11px] text-stone-400">
            Kas: {formatIDR(totalLiquid)} • Aset lain: {formatIDR(netWorthData.totalOtherAssets)}
          </p>
        </div>

      </div>

      {/* Zero State Encouragement (FR-09 AC) */}
      {!hasAnyTransactions && (
        <div className="bg-amber-50/60 rounded-3xl p-8 border border-amber-200 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-800">
            Belum Ada Transaksi Bulan Ini
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
            Mulai kebiasaan sehat hari ini. Catat belanja makan siang, sembako, atau tagihan listrik Anda pertama kali.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('input')}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow transition"
            >
              + Catat Pengeluaran Pertama
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Plan vs Actual Breakdown & Emotional Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Category Progress (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Realisasi Anggaran per Kategori
              </h3>
              <p className="text-xs text-stone-500">
                Bandingkan rencana alokasi vs realisasi belanja aktual.
              </p>
            </div>
            {!setup && (
              <button
                onClick={() => onNavigate('setup')}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                + Buat Setup Anggaran
              </button>
            )}
          </div>

          {planVsActual.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">
              Belum ada kategori yang dialokasikan atau dibelanjakan.
            </p>
          ) : (
            <div className="space-y-4">
              {planVsActual.map((item) => {
                const percent = Math.min(item.percentUsed, 100);
                const isOver = item.actual > item.planned;
                const isNear = !isOver && item.percentUsed >= 80;

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800">{item.category}</span>
                        <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                          item.status === 'Perlu adjust'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900">{formatIDR(item.actual)}</span>
                        <span className="text-stone-400 text-[11px]"> / {formatIDR(item.planned)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-600' :
                          isNear ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${item.planned > 0 ? percent : 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Projection box */}
          {safeDaily.totalPlannedBudget > 0 && (
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-stone-800 block">Proyeksi Pengeluaran Akhir Bulan</span>
                <span className="text-stone-500 text-[11px]">
                  Berdasarkan tempo belanja rata-rata harian Anda saat ini.
                </span>
              </div>
              <span className="text-sm font-black text-stone-900 whitespace-nowrap">
                {formatIDR(safeDaily.projectedMonthEnd)}
              </span>
            </div>
          )}

        </div>

        {/* Right Column: Emotional Spending Summary & Pockets preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Emotional Spending Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase tracking-wider">
                <Smile className="w-4 h-4" />
                <span>Pola Emosi Belanja</span>
              </div>
              <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                Emotional Spending Summary
              </h4>
              <p className="text-[11px] text-stone-500">
                Porsi pengeluaran berdasarkan perasaan saat bertransaksi.
              </p>
            </div>

            {moodList.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                Belum ada transaksi dengan penanda mood.
              </div>
            ) : (
              <div className="space-y-3">
                {moodList.map(([moodName, data]) => {
                  const mObj = MOODS.find(m => m.type === moodName);
                  const portion = summary.totalExpense > 0 ? Math.round((data.total / summary.totalExpense) * 100) : 0;

                  return (
                    <div key={moodName} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{mObj?.emoji || '😺'}</span>
                        <div>
                          <span className="font-semibold text-stone-800 block">{moodName}</span>
                          <span className="text-[10px] text-stone-400">{data.count} transaksi</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 block">{formatIDR(data.total)}</span>
                        <span className="text-[10px] text-stone-500 font-medium">{portion}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Pockets Summary */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-900">
                Saldo Kantong Utama
              </h4>
              <button
                onClick={() => onNavigate('pockets')}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Lihat Semua →
              </button>
            </div>

            <div className="space-y-2.5">
              {pockets.slice(0, 4).map(p => {
                const bal = pocketBalances.get(p.id)?.balance || 0;
                return (
                  <div key={p.id} className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700">{p.name}</span>
                    <span className={`font-bold ${bal >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
                      {formatIDR(bal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
