import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  HelpCircle, 
  Trophy, 
  ArrowRight, 
  Save, 
  Sparkles, 
  Calendar,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import type { BudgetSetup, Transaction, ReflectionData, RealityCheckAnswers } from '../types';
import { db } from '../db';
import { formatIDR, formatMonthYear, formatDateIndo } from '../utils/formatters';
import { calculateMonthlySummary, calculatePlanVsActual } from '../utils/calculator';

interface RekapRealityCheckSectionProps {
  currentMonth: string;
  setup?: BudgetSetup;
  transactions: Transaction[];
  onMonthClosed?: () => void;
  onNavigateToNextMonth?: (nextMonth: string) => void;
}

export const RekapRealityCheckSection: React.FC<RekapRealityCheckSectionProps> = ({
  currentMonth,
  setup,
  transactions,
  onMonthClosed,
  onNavigateToNextMonth
}) => {
  const summary = calculateMonthlySummary(transactions, currentMonth);
  const planVsActual = calculatePlanVsActual(setup, summary.expenseByCategory);

  const [financialWin, setFinancialWin] = useState('');
  const [answers, setAnswers] = useState<RealityCheckAnswers>({
    q1: '',
    q2: '',
    q3: '',
    q4: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [savedData, setSavedData] = useState<ReflectionData | null>(null);

  useEffect(() => {
    loadReflection();
  }, [currentMonth]);

  const loadReflection = async () => {
    const data = await db.reflections.get(currentMonth);
    if (data) {
      setSavedData(data);
      setFinancialWin(data.financialWin || '');
      if (data.realityCheck) {
        setAnswers(data.realityCheck);
      }
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
      closedAt: savedData?.closedAt,
    };

    await db.reflections.put(data);
    setSavedData(data);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleCloseMonthAndRollover = async () => {
    if (confirm(`Apakah Anda yakin ingin menyelesaikan ritual Tutup Bulan ${formatMonthYear(currentMonth)} dan menyiapkan draft bulan depan?`)) {
      // Mark closed
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

      // Create next month setup draft if not exists (FR-04)
      const [year, monthNum] = currentMonth.split('-').map(Number);
      const nextDate = new Date(year, monthNum, 1);
      const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

      const existingNextSetup = await db.setups.get(nextMonthStr);
      if (!existingNextSetup && setup) {
        await db.setups.put({
          ...setup,
          month: nextMonthStr,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Rollover recurring transactions (FR-04 & FR-21)
      const recurringTxs = transactions.filter(t => t.isRecurring);
      for (const rec of recurringTxs) {
        const nextDayStr = `${nextMonthStr}-${rec.date.slice(8, 10)}`;
        const nextTx: Transaction = {
          ...rec,
          id: `tx-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: nextDayStr,
          month: nextMonthStr,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.transactions.add(nextTx);
      }

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 }
      });

      alert(`Bulan ${formatMonthYear(currentMonth)} resmi ditutup! Draft dan tagihan rutin telah disiapkan untuk ${formatMonthYear(nextMonthStr)}.`);

      if (onMonthClosed) onMonthClosed();
      if (onNavigateToNextMonth) onNavigateToNextMonth(nextMonthStr);
    }
  };

  const realityQuestions = [
    {
      key: 'q1' as const,
      num: '1',
      question: 'Apakah ada pengeluaran impulsif atau emosional yang bisa dihindari bulan ini?',
      placeholder: 'Jujur pada diri sendiri: jajan kopi berlebihan saat lembur, check-out e-commerce saat suntuk, dll.'
    },
    {
      key: 'q2' as const,
      num: '2',
      question: 'Apakah kiriman untuk keluarga/orang tua lancar dan sesuai porsi tanpa mengorbankan pos darurat?',
      placeholder: 'Misal: aman dan tepat waktu, atau sempat nombok karena orang tua ada kebutuhan mendesak.'
    },
    {
      key: 'q3' as const,
      num: '3',
      question: 'Bagaimana kondisi dana darurat bulan ini? Apakah aman atau terpaksa terpakai?',
      placeholder: 'Misal: utuh tidak tersentuh, atau terpakai Rp500.000 untuk servis motor mogok.'
    },
    {
      key: 'q4' as const,
      num: '4',
      question: 'Apakah kamu merasa cukup menghargai dirimu (self-reward/healing) secara proporsional?',
      placeholder: 'Apakah porsi istirahat dan apresiasi diri sudah pas, tidak pelit tapi juga tidak kebablasan?'
    }
  ];

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Rekap Bulanan & Reality Check
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {formatMonthYear(currentMonth)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Evaluasi rencana vs aktual secara objektif dan jawab 4 pertanyaan kejujuran finansial sebelum menutup bulan.
          </p>
        </div>

        {savedData?.isClosed && (
          <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Bulan Ini Telah Ditutup ({formatDateIndo(savedData.closedAt?.slice(0, 10) || '')})</span>
          </span>
        )}
      </div>

      {/* Financial Win Card */}
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-950">
              Financial Win Bulan Ini
            </h3>
            <p className="text-xs text-amber-800">
              Apresiasi pencapaian finansial Anda sekecil apa pun: berhasil menabung, melunasi cicilan, atau tidak berhutang.
            </p>
          </div>
        </div>

        <textarea
          rows={3}
          value={financialWin}
          onChange={(e) => setFinancialWin(e.target.value)}
          placeholder="Tuliskan kemenangan finansial Anda... Contoh: Berhasil transfer uang bulanan ke orang tua di hari gajian dan dana darurat tidak terpakai sepeser pun!"
          className="w-full p-4 rounded-2xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm bg-white/90 text-stone-900"
        />
      </div>

      {/* Rencana vs Realisasi Table (FR-11) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-stone-900">
            Tabel Evaluasi: Rencana vs Realisasi
          </h3>
          <p className="text-xs text-stone-500">
            Kategori dengan realisasi melebihi rencana ditandai "Perlu adjust" untuk diperbaiki bulan depan.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-y border-stone-200">
              <tr>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-right">Rencana</th>
                <th className="py-3 px-3 text-right">Realisasi</th>
                <th className="py-3 px-3 text-right">Selisih</th>
                <th className="py-3 px-3 text-right">% Terpakai</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {planVsActual.map((item) => (
                <tr key={item.category} className="hover:bg-stone-50/80">
                  <td className="py-3 px-3 font-bold text-stone-900">
                    {item.category}
                  </td>
                  <td className="py-3 px-3 text-right text-stone-600 font-medium">
                    {formatIDR(item.planned)}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-stone-900">
                    {formatIDR(item.actual)}
                  </td>
                  <td className={`py-3 px-3 text-right font-semibold ${item.diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {item.diff < 0 ? `-${formatIDR(Math.abs(item.diff))}` : `+${formatIDR(item.diff)}`}
                  </td>
                  <td className="py-3 px-3 text-right text-stone-600 font-medium">
                    {item.percentUsed}%
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'Perlu adjust'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reality Check 4 Questions (FR-11) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Reality Check (4 Pertanyaan Kejujuran Finansial)</span>
          </div>
          <h3 className="text-lg font-bold text-stone-900">
            Refleksi Kejujuran Anggaran
          </h3>
          <p className="text-xs text-stone-500">
            Jawab dengan tenang dan jujur. Angka yang akurat bermula dari kejujuran melihat kebiasaan diri.
          </p>
        </div>

        <div className="space-y-5">
          {realityQuestions.map((q) => (
            <div key={q.key} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                <span className="text-rose-600 mr-1.5">#{q.num}</span>
                {q.question}
              </label>
              <textarea
                rows={2}
                value={answers[q.key]}
                onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                placeholder={q.placeholder}
                className="w-full p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-white text-stone-900"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100">
          <button
            onClick={handleSaveRealityCheck}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Tersimpan!' : 'Simpan Jawaban Reality Check'}</span>
          </button>

          <button
            onClick={handleCloseMonthAndRollover}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tutup Bulan Ini & Buat Draft Bulan Baru →</span>
          </button>
        </div>
      </div>

    </div>
  );
};
