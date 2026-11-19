import React from 'react';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowRight, 
  Sparkles, 
  PlusCircle, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight,
  Edit2,
  Heart
} from 'lucide-react';
import type { BudgetSetup, Transaction, Pocket, UserProfile } from '../../types';
import { formatIDR, formatDateIndo, formatMonthYear } from '../../utils/formatters';
import { 
  calculateMonthlySummary, 
  calculateSafeDailySpend, 
  calculatePocketBalances 
} from '../../utils/calculator';
import { MOODS } from '../../db';

interface MobileHomeProps {
  currentMonth: string;
  setup?: BudgetSetup;
  transactions: Transaction[];
  pockets: Pocket[];
  profile?: UserProfile;
  onOpenQuickInput: () => void;
  onNavigateToTab: (tab: any) => void;
  onOpenOnboarding: () => void;
}

export const MobileHome: React.FC<MobileHomeProps> = ({
  currentMonth,
  setup,
  transactions,
  pockets,
  profile,
  onOpenQuickInput,
  onNavigateToTab,
  onOpenOnboarding,
}) => {
  const summary = calculateMonthlySummary(transactions, currentMonth);
  const safeDaily = calculateSafeDailySpend(setup, summary.totalExpense);

  const pocketBalances = calculatePocketBalances(pockets, transactions);
  let totalLiquid = 0;
  for (const b of pocketBalances.values()) {
    totalLiquid += b.balance;
  }

  // Calculate Family vs Personal spending
  const familyBudget = setup ? (setup.income * (setup.familyPercentage || 70)) / 100 : 0;
  const personalBudget = setup ? (setup.income * (setup.personalPercentage || 30)) / 100 : 0;

  let familyActual = 0;
  let personalActual = 0;

  if (setup) {
    const familyCatNames = new Set(setup.familyAllocation.map(f => f.name));
    for (const [cat, amt] of Object.entries(summary.expenseByCategory)) {
      if (familyCatNames.has(cat)) {
        familyActual += amt;
      } else {
        personalActual += amt;
      }
    }
  } else {
    familyActual = summary.totalExpense;
  }

  const familyPercent = familyBudget > 0 ? Math.min(100, Math.round((familyActual / familyBudget) * 100)) : 0;
  const personalPercent = personalBudget > 0 ? Math.min(100, Math.round((personalActual / personalBudget) * 100)) : 0;

  // Recent transactions (top 5)
  const recentTxs = transactions
    .filter(t => t.month === currentMonth || t.date.startsWith(currentMonth))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const isSandwich = profile ? profile.isSandwich : true;
  const marital = profile?.maritalStatus || 'single';

  return (
    <div className="space-y-4 pb-20 text-left max-w-md mx-auto">
      
      {/* 0. Persona & User Greeting Pill */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {isSandwich ? '🥪' : '🕊️'}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-stone-900">
                Halo, {profile?.name || 'Pejuang Meowney'}!
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                isSandwich ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isSandwich ? 'Sandwich Gen' : 'Bebas Sandwich'}
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              {marital === 'single' ? 'Single (Mandiri)' : marital === 'married' ? 'Menikah' : 'Menikah & Anak'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenOnboarding}
          title="Ubah profil persona"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition flex items-center gap-1 text-[11px] font-semibold"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="text-[10px]">Ubah</span>
        </button>
      </div>

      {/* 1. Main Hero Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-rose-950 p-6 text-white shadow-xl">
        
        {/* Subtle decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 p-1 flex items-center justify-center">
              <img src="/lucky-cat.png" alt="Lucky Cat" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <p className="text-[10px] text-stone-300 uppercase tracking-widest font-semibold">
                Meowney • {formatMonthYear(currentMonth)}
              </p>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            safeDaily.status === 'melewati' ? 'bg-rose-500 text-white' :
            safeDaily.status === 'mendekati' ? 'bg-amber-400 text-amber-950' :
            'bg-emerald-500/90 text-white'
          }`}>
            {safeDaily.status === 'aman' ? '🟢 AMAN' : safeDaily.status === 'mendekati' ? '🟡 WASPADA' : '🔴 LEWAT'}
          </span>
        </div>

        {/* Total Saldo Kas */}
        <div className="mt-2">
          <span className="text-[11px] text-stone-300 font-medium">Total Saldo Kas Berjalan</span>
          <p className="text-3xl font-black tracking-tight text-white mt-0.5">
            {formatIDR(totalLiquid)}
          </p>
        </div>

        {/* Safe Daily Spend Highlight Banner */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-300" />
            </div>
            <div>
              <span className="text-[10px] text-stone-300 uppercase block font-semibold">Batas Belanja Hari Ini</span>
              <span className="text-sm font-black text-amber-300">
                {safeDaily.safeDailyAmount > 0 ? `${formatIDR(safeDaily.safeDailyAmount)}/hari` : 'Rp 0/hari'}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenQuickInput}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center gap-1"
          >
            <span>+ Catat</span>
          </button>
        </div>

      </div>

      {/* 2. Dua Lapis Alokasi Ringkas */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            {isSandwich ? 'Alokasi Sandwich Dua Lapis' : 'Alokasi Anggaran Terbagi'}
          </h3>
          {!setup && (
            <button
              onClick={() => onNavigateToTab('menu')}
              className="text-[11px] font-bold text-rose-600"
            >
              + Setup Anggaran
            </button>
          )}
        </div>

        {/* Lapis 1 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              {isSandwich ? '👨‍👩‍👧‍👦' : '🏡'} <strong>{isSandwich ? 'Keluarga & Orang Tua:' : 'Keluarga & Komitmen:'}</strong>
            </span>
            <span className="font-bold text-stone-900">
              {formatIDR(familyActual)} <span className="text-stone-400 font-normal">/ {formatIDR(familyBudget)}</span>
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                familyActual > familyBudget && familyBudget > 0 ? 'bg-rose-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${familyBudget > 0 ? familyPercent : 0}%` }}
            />
          </div>
        </div>

        {/* Lapis 2 */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-stone-700 flex items-center gap-1">
              🧘 <strong>Personal & Masa Depan:</strong>
            </span>
            <span className="font-bold text-stone-900">
              {formatIDR(personalActual)} <span className="text-stone-400 font-normal">/ {formatIDR(personalBudget)}</span>
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                personalActual > personalBudget && personalBudget > 0 ? 'bg-rose-600' : 'bg-amber-500'
              }`}
              style={{ width: `${personalBudget > 0 ? personalPercent : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Quick Pockets Carousel / List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Kantong Saldo Utama
          </span>
          <button
            onClick={() => onNavigateToTab('pockets')}
            className="text-xs font-bold text-rose-600 flex items-center gap-0.5 hover:underline"
          >
            <span>Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {pockets.slice(0, 4).map(p => {
            const bal = pocketBalances.get(p.id)?.balance || 0;
            return (
              <div
                key={p.id}
                onClick={() => onNavigateToTab('pockets')}
                className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm cursor-pointer hover:border-stone-300 transition"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs">👛</span>
                  <span className="text-xs font-bold text-stone-700 truncate">{p.name}</span>
                </div>
                <p className={`text-sm font-extrabold ${bal >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
                  {formatIDR(bal)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Transaksi Terakhir */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Transaksi Terakhir
          </span>
          <button
            onClick={onOpenQuickInput}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            + Tambah
          </button>
        </div>

        {recentTxs.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400">
            Belum ada transaksi bulan ini. Tap tombol (+) untuk mulai mencatat.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {recentTxs.map(t => {
              const mObj = MOODS.find(m => m.type === t.mood);
              const isExpense = t.mode === 'expense';
              const isIncome = t.mode === 'income';

              return (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">
                      {mObj ? mObj.emoji : isExpense ? '💸' : isIncome ? '💰' : '🔄'}
                    </span>
                    <div>
                      <span className="font-bold text-stone-900 block truncate max-w-[140px] sm:max-w-[180px]">
                        {t.categoryOrSource}
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        {formatDateIndo(t.date)} {t.note ? `• ${t.note}` : ''}
                      </span>
                    </div>
                  </div>

                  <span className={`font-extrabold whitespace-nowrap ${
                    isExpense ? 'text-rose-600' : isIncome ? 'text-emerald-600' : 'text-blue-600'
                  }`}>
                    {isExpense ? `-${formatIDR(t.amount)}` : isIncome ? `+${formatIDR(t.amount)}` : formatIDR(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
