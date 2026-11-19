import React, { useState } from 'react';
import { 
  CalendarRange, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Award, 
  Download,
  Calendar
} from 'lucide-react';
import type { Transaction } from '../types';
import { formatIDR, MONTH_NAMES_ID } from '../utils/formatters';
import { calculateMonthlySummary } from '../utils/calculator';
import Papa from 'papaparse';

interface TahunanSectionProps {
  transactions: Transaction[];
  selectedYear?: number;
}

export const TahunanSection: React.FC<TahunanSectionProps> = ({
  transactions,
  selectedYear = new Date().getFullYear()
}) => {
  const [year, setYear] = useState<number>(selectedYear);

  // 12 Months data computation (Jan - Des)
  const monthList = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0');
    const monthKey = `${year}-${monthNum}`;
    const txsInMonth = transactions.filter(t => t.date.startsWith(monthKey));
    const hasData = txsInMonth.length > 0;
    const summary = calculateMonthlySummary(transactions, monthKey);

    return {
      monthKey,
      monthName: MONTH_NAMES_ID[i],
      hasData,
      income: summary.totalIncome,
      expense: summary.totalExpense,
      net: summary.netCashflow,
      txCount: summary.transactionCount,
      expenseByCategory: summary.expenseByCategory
    };
  });

  // Year aggregates
  let totalYearIncome = 0;
  let totalYearExpense = 0;
  let totalYearTxs = 0;
  const categoryTotals: Record<string, number> = {};

  for (const m of monthList) {
    if (m.hasData) {
      totalYearIncome += m.income;
      totalYearExpense += m.expense;
      totalYearTxs += m.txCount;

      for (const [cat, amt] of Object.entries(m.expenseByCategory)) {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      }
    }
  }

  // Top 3 Expense Categories (FR-13)
  const top3Categories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Highest expense for bar scaling
  const maxExpense = Math.max(...monthList.map(m => m.hasData ? m.expense : 0), 1);

  const handleDownloadAnnualCSV = () => {
    const data = monthList.map(m => ({
      'Bulan': m.monthName,
      'Tahun': year,
      'Status': m.hasData ? 'Ada Data' : 'Kosong',
      'Total Pemasukan': m.hasData ? m.income : '-',
      'Total Pengeluaran': m.hasData ? m.expense : '-',
      'Arus Kas Bersih': m.hasData ? m.net : '-',
      'Jumlah Transaksi': m.txCount
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan-Tahunan-${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title & Year Picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Laporan Tahunan {year}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              12 Bulan Jan–Des
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Lihat pola arus kas setahun penuh untuk perencanaan besar tahun depan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl border border-stone-300 font-bold text-xs bg-white text-stone-800"
          >
            {[2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>Tahun {y}</option>
            ))}
          </select>

          <button
            onClick={handleDownloadAnnualCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-stone-500" />
            <span>Unduh CSV Tahunan</span>
          </button>
        </div>
      </div>

      {/* Top Year Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Total Pemasukan Setahun
          </span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">
            {formatIDR(totalYearIncome)}
          </p>
          <p className="text-[11px] text-stone-400">Total akumulasi Jan–Des</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Total Pengeluaran Setahun
          </span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600">
            {formatIDR(totalYearExpense)}
          </p>
          <p className="text-[11px] text-stone-400">
            Total transaksi: {totalYearTxs} kali
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Akumulasi Tabungan Bersih
          </span>
          <p className={`text-2xl sm:text-3xl font-black ${
            (totalYearIncome - totalYearExpense) >= 0 ? 'text-stone-900' : 'text-rose-600'
          }`}>
            {formatIDR(totalYearIncome - totalYearExpense)}
          </p>
          <p className="text-[11px] text-stone-400">Pemasukan dikurangi pengeluaran</p>
        </div>
      </div>

      {/* Top 3 Categories (FR-13) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-stone-900">
            3 Pos Pengeluaran Terbesar Sepanjang Tahun {year}
          </h3>
        </div>

        {top3Categories.length === 0 ? (
          <p className="text-xs text-stone-400 py-3">Belum ada data pengeluaran di tahun {year}.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3Categories.map(([cat, val], idx) => {
              const pct = totalYearExpense > 0 ? Math.round((val / totalYearExpense) * 100) : 0;
              return (
                <div key={cat} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-rose-600">#{idx + 1} {cat}</span>
                    <span className="text-stone-500">{pct}% porsi</span>
                  </div>
                  <p className="text-lg font-black text-stone-900">{formatIDR(val)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 12-Month Bar Visualizer (Jan - Des) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Grafik Pola Pengeluaran 12 Bulan (Jan–Des)
          </h3>
          <p className="text-xs text-stone-500">
            Bulan tanpa data tampil kosong secara eksplisit, bukan nol yang menyiratkan tidak ada pengeluaran.
          </p>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 items-end h-56 border-b border-stone-200 pb-2">
          {monthList.map(m => {
            const heightPercent = m.hasData && maxExpense > 0 ? Math.round((m.expense / maxExpense) * 100) : 0;

            return (
              <div key={m.monthKey} className="flex flex-col items-center h-full justify-end group">
                {m.hasData ? (
                  <div
                    className="w-full max-w-[28px] bg-rose-500 rounded-t-lg transition-all group-hover:bg-rose-600 relative"
                    style={{ height: `${Math.max(8, heightPercent)}%` }}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[9px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20">
                      {formatIDR(m.expense)}
                    </span>
                  </div>
                ) : (
                  <div className="w-full max-w-[28px] h-2 bg-stone-100 rounded-t border-t border-dashed border-stone-300" title="Belum ada data" />
                )}
                <span className="text-[10px] text-stone-500 font-bold mt-2 truncate w-full text-center">
                  {m.monthName.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Month Summary Grid (FR-13) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-stone-900">
          Grid Ringkasan 12 Bulan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monthList.map(m => (
            <div
              key={m.monthKey}
              className={`p-4 rounded-2xl border transition ${
                m.hasData ? 'bg-stone-50 border-stone-200' : 'bg-stone-50/40 border-dashed border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-stone-900 text-xs">{m.monthName}</span>
                {m.hasData ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {m.txCount} tx
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-medium">
                    (Belum ada data)
                  </span>
                )}
              </div>

              {m.hasData ? (
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-stone-500">
                    <span>Masuk:</span>
                    <span className="font-semibold text-emerald-600">{formatIDR(m.income)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Keluar:</span>
                    <span className="font-semibold text-rose-600">{formatIDR(m.expense)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-stone-200 pt-1 mt-1 text-stone-900">
                    <span>Bersih:</span>
                    <span>{formatIDR(m.net)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-stone-400 italic py-2">
                  Tidak ada catatan di bulan ini.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
