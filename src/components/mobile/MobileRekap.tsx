import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BarChart3, 
  Download, 
  HelpCircle, 
  CheckCircle2, 
  Trophy, 
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import type { BudgetSetup, Transaction, Pocket, ReflectionData, RealityCheckAnswers } from '../../types';
import { db } from '../../db';
import { formatIDR, formatMonthYear } from '../../utils/formatters';
import { calculateMonthlySummary, calculatePlanVsActual } from '../../utils/calculator';
import { exportMonthlyPDF, exportMonthlyCSV } from '../../utils/pdfExport';

interface MobileRekapProps {
  currentMonth: string;
  setup?: BudgetSetup;
  transactions: Transaction[];
  pockets: Pocket[];
  onMonthClosed: () => void;
}

export const MobileRekap: React.FC<MobileRekapProps> = ({
  currentMonth,
  setup,
  transactions,
  pockets,
  onMonthClosed,
}) => {
  const summary = calculateMonthlySummary(transactions, currentMonth);
  const planVsActual = calculatePlanVsActual(setup, summary.expenseByCategory);

  const [financialWin, setFinancialWin] = useState('');
  const [answers, setAnswers] = useState<RealityCheckAnswers>({
    q1: '', q2: '', q3: '', q4: ''
  });
  const [savedData, setSavedData] = useState<ReflectionData | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    const data = await db.reflections.get(currentMonth);
    if (data) {
      setSavedData(data);
      setFinancialWin(data.financialWin || '');
      if (data.realityCheck) setAnswers(data.realityCheck);
    } else {
      setSavedData(null);
      setFinancialWin('');
      setAnswers({ q1: '', q2: '', q3: '', q4: '' });
    }
  };

  const handleSaveRealityCheck = async () => {
    const data: ReflectionData = {
      month: currentMonth,
      financialWin,
      realityCheck: answers,
      happyMoment: savedData?.happyMoment || '',
      nextMonthTarget: savedData?.nextMonthTarget || '',
      freeNotes: savedData?.freeNotes || '',
      isClosed: savedData?.isClosed || false,
      closedAt: savedData?.closedAt
    };
    await db.reflections.put(data);
    setSavedData(data);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleCloseMonth = async () => {
    if (confirm(`Tutup bulan ${formatMonthYear(currentMonth)} dan siapkan draft bulan baru?`)) {
      const updated: ReflectionData = {
        month: currentMonth,
        financialWin,
        realityCheck: answers,
        happyMoment: savedData?.happyMoment || '',
        nextMonthTarget: savedData?.nextMonthTarget || '',
        freeNotes: savedData?.freeNotes || '',
        isClosed: true,
        closedAt: new Date().toISOString()
      };
      await db.reflections.put(updated);
      setSavedData(updated);

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      alert(`Bulan ${formatMonthYear(currentMonth)} resmi ditutup!`);
      onMonthClosed();
    }
  };

  return (
    <div className="space-y-4 pb-20 text-left max-w-md mx-auto">
      
      {/* Month Title & Download */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight">
            Rekap & Evaluasi
          </h2>
          <span className="text-[11px] text-stone-500">{formatMonthYear(currentMonth)}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => exportMonthlyCSV(transactions, currentMonth)}
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition"
            title="Unduh CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={() => exportMonthlyPDF(currentMonth, setup, transactions, pockets)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Total Masuk</span>
          <p className="text-base font-black text-stone-900 mt-0.5">{formatIDR(summary.totalIncome)}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-rose-700 block">Total Keluar</span>
          <p className="text-base font-black text-stone-900 mt-0.5">{formatIDR(summary.totalExpense)}</p>
        </div>
      </div>

      {/* Plan vs Actual Simple Progress List */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
          Rencana vs Realisasi Belanja
        </h3>

        <div className="space-y-3">
          {planVsActual.slice(0, 6).map(item => {
            const isOver = item.actual > item.planned;
            return (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-stone-800 truncate max-w-[150px]">
                    {item.category}
                  </span>
                  <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-stone-700'}`}>
                    {formatIDR(item.actual)} / {formatIDR(item.planned)}
                  </span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-600' : 'bg-emerald-500'}`}
                    style={{ width: `${item.planned > 0 ? Math.min(100, item.percentUsed) : 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Win Card */}
      <div className="bg-amber-50/80 rounded-3xl p-5 border border-amber-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>Kemenangan Finansial Bulan Ini</span>
        </div>
        <textarea
          rows={2}
          value={financialWin}
          onChange={(e) => setFinancialWin(e.target.value)}
          placeholder="Contoh: Berhasil tidak ngutang dan kirim uang ortu tepat waktu!"
          className="w-full p-3 rounded-xl border border-amber-300 text-xs bg-white text-stone-900"
        />
      </div>

      {/* Reality Check 4 Questions (Compact) */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-1.5 text-stone-800 font-bold">
          <HelpCircle className="w-4 h-4 text-rose-600" />
          <span>Reality Check (Kejujuran Finansial)</span>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              1. Ada belanja impulsif/emosional yang bisa dihindari?
            </label>
            <input
              type="text"
              value={answers.q1}
              onChange={(e) => setAnswers({ ...answers, q1: e.target.value })}
              placeholder="Jawab singkat..."
              className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              2. Kiriman orang tua & sembako keluarga lancar?
            </label>
            <input
              type="text"
              value={answers.q2}
              onChange={(e) => setAnswers({ ...answers, q2: e.target.value })}
              placeholder="Jawab singkat..."
              className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              3. Bagaimana kondisi dana darurat bulan ini?
            </label>
            <input
              type="text"
              value={answers.q3}
              onChange={(e) => setAnswers({ ...answers, q3: e.target.value })}
              placeholder="Jawab singkat..."
              className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              4. Cukup menghargai diri sendiri secara wajar?
            </label>
            <input
              type="text"
              value={answers.q4}
              onChange={(e) => setAnswers({ ...answers, q4: e.target.value })}
              placeholder="Jawab singkat..."
              className="w-full p-2.5 rounded-xl border border-stone-200 text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleSaveRealityCheck}
            className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs"
          >
            {isSaved ? 'Tersimpan!' : 'Simpan Jawaban'}
          </button>

          <button
            onClick={handleCloseMonth}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shadow-sm"
          >
            Tutup Bulan Ini & Buat Draft Bulan Baru
          </button>
        </div>
      </div>

    </div>
  );
};
