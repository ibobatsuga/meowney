import React from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Layers
} from 'lucide-react';
import type { BudgetSetup, Transaction, Pocket } from '../types';
import { formatIDR, formatMonthYear } from '../utils/formatters';
import { calculateMonthlySummary, calculatePlanVsActual, calculatePocketBalances } from '../utils/calculator';
import { exportMonthlyPDF, exportMonthlyCSV } from '../utils/pdfExport';

interface LaporanSectionProps {
  currentMonth: string;
  setup?: BudgetSetup;
  transactions: Transaction[];
  pockets: Pocket[];
}

export const LaporanSection: React.FC<LaporanSectionProps> = ({
  currentMonth,
  setup,
  transactions,
  pockets
}) => {
  const summary = calculateMonthlySummary(transactions, currentMonth);
  const planVsActual = calculatePlanVsActual(setup, summary.expenseByCategory);

  // Calculate Previous Month Summary for Comparison (FR-12)
  const [year, monthNum] = currentMonth.split('-').map(Number);
  const prevDate = new Date(year, monthNum - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevSummary = calculateMonthlySummary(transactions, prevMonthStr);

  // Arus kas per FR-05: Saldo Awal, Masuk, Keluar, Saldo Akhir
  // Saldo Awal is cumulative net cashflow before currentMonth
  const priorTransactions = transactions.filter(t => t.date < `${currentMonth}-01`);
  let saldoAwal = 0;
  for (const t of priorTransactions) {
    if (t.mode === 'income') saldoAwal += t.amount;
    else if (t.mode === 'expense') saldoAwal -= t.amount;
  }
  const saldoAkhir = saldoAwal + summary.totalIncome - summary.totalExpense;

  const handleDownloadPDF = () => {
    exportMonthlyPDF(currentMonth, setup, transactions, pockets);
  };

  const handleDownloadCSV = () => {
    exportMonthlyCSV(transactions, currentMonth);
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title & Downloads */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Laporan Keuangan & Arus Kas
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {formatMonthYear(currentMonth)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Unduh laporan resmi PDF atau data mutasi CSV untuk dokumentasi pribadi di luar browser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Unduh CSV</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Cash Flow Statement (FR-05 & FR-12) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900">
            Laporan Arus Kas (Cash Flow Statement)
          </h3>
          <p className="text-xs text-stone-500">
            Rumus baku: Saldo Akhir = Saldo Awal + Masuk − Keluar. Keluar ditampilkan sebagai angka positif pada kolomnya.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <tbody className="divide-y divide-stone-100">
              <tr className="hover:bg-stone-50">
                <td className="py-3.5 px-4 font-semibold text-stone-700">Saldo Awal Bulan</td>
                <td className="py-3.5 px-4 text-right font-bold text-stone-900">{formatIDR(saldoAwal)}</td>
              </tr>
              <tr className="hover:bg-stone-50">
                <td className="py-3.5 px-4 font-semibold text-emerald-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Total Pemasukan (+)</span>
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">{formatIDR(summary.totalIncome)}</td>
              </tr>
              <tr className="hover:bg-stone-50">
                <td className="py-3.5 px-4 font-semibold text-rose-700 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" />
                  <span>Total Pengeluaran (−)</span>
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">{formatIDR(summary.totalExpense)}</td>
              </tr>
              <tr className="bg-stone-50 font-bold">
                <td className="py-4 px-4 text-stone-900 text-sm">Saldo Akhir Bulan Terhitung</td>
                <td className={`py-4 px-4 text-right text-base font-black ${saldoAkhir >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
                  {formatIDR(saldoAkhir)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison With Previous Month (FR-12) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900">
            Perbandingan dengan Bulan Sebelumnya ({formatMonthYear(prevMonthStr)})
          </h3>
          <p className="text-xs text-stone-500">
            Evaluasi apakah pengeluaran keluarga dan personal Anda meningkat atau menurun dibanding bulan lalu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">Pemasukan Bulan Lalu</span>
            <p className="text-base font-bold text-stone-800">{formatIDR(prevSummary.totalIncome)}</p>
            <p className="text-[11px] text-stone-400">
              {summary.totalIncome >= prevSummary.totalIncome
                ? `Naik ${formatIDR(summary.totalIncome - prevSummary.totalIncome)}`
                : `Turun ${formatIDR(prevSummary.totalIncome - summary.totalIncome)}`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">Pengeluaran Bulan Lalu</span>
            <p className="text-base font-bold text-stone-800">{formatIDR(prevSummary.totalExpense)}</p>
            <p className={`text-[11px] ${
              summary.totalExpense <= prevSummary.totalExpense ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {summary.totalExpense <= prevSummary.totalExpense
                ? `Hemat ${formatIDR(prevSummary.totalExpense - summary.totalExpense)} dibanding bulan lalu`
                : `Meningkat ${formatIDR(summary.totalExpense - prevSummary.totalExpense)} dibanding bulan lalu`}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">Arus Kas Bersih Bulan Lalu</span>
            <p className="text-base font-bold text-stone-800">{formatIDR(prevSummary.netCashflow)}</p>
            <p className="text-[11px] text-stone-400">
              Bulan ini: {formatIDR(summary.netCashflow)}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
