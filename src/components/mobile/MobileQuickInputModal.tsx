import React, { useState } from 'react';
import { 
  X, 
  TrendingDown, 
  TrendingUp, 
  ArrowRightLeft, 
  Smile, 
  Check, 
  Sparkles,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import type { Transaction, TransactionMode, MoodType, Pocket, BudgetSetup } from '../../types';
import { db, EXPENSE_CATEGORIES, INCOME_SOURCES, MOODS } from '../../db';
import { formatIDR, getTodayDateStr } from '../../utils/formatters';

interface MobileQuickInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  pockets: Pocket[];
  currentMonth: string;
  setup?: BudgetSetup;
  onSaved: () => void;
}

export const MobileQuickInputModal: React.FC<MobileQuickInputModalProps> = ({
  isOpen,
  onClose,
  pockets,
  currentMonth,
  setup,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<TransactionMode>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [pocketId, setPocketId] = useState<string>(pockets[0]?.id || 'pkt-kas-umum');
  const [destPocketId, setDestPocketId] = useState<string>(pockets[1]?.id || 'pkt-dompet-belanja');
  const [mood, setMood] = useState<MoodType | undefined>('Biasa');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Math.round(Number(amountStr) || 0);

  // Quick increment buttons
  const addQuickAmount = (val: number) => {
    setAmountStr(prev => {
      const cur = Number(prev) || 0;
      return String(cur + val);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setError('Masukkan nominal transaksi lebih dari 0.');
      return;
    }

    if (mode === 'transfer' && pocketId === destPocketId) {
      setError('Kantong asal dan tujuan tidak boleh sama.');
      return;
    }

    const txMonth = date.slice(0, 7);
    const newTx: Transaction = {
      id: `tx-m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      month: txMonth,
      mode,
      categoryOrSource: mode === 'transfer' ? 'Pindah Dana' : category,
      amount: numericAmount,
      pocketId,
      destinationPocketId: mode === 'transfer' ? destPocketId : undefined,
      mood: mode === 'expense' ? mood : undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.transactions.add(newTx);
    onSaved();
    onClose();
  };

  // Common quick categories
  const commonCategories = [
    'Makan', 'Belanja Bulanan', 'Beras & Sembako', 'Listrik & Air', 
    'Transportasi', 'Orang Tua', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Kebutuhan Pribadi'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Bottom Sheet Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-stone-200 z-10 max-h-[90vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
              ✍️
            </span>
            <h3 className="text-base font-extrabold text-stone-900">
              Catat Transaksi Cepat
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('expense');
              setCategory('Makan');
              setError(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('income');
              setCategory('Gaji & Bonus');
              setError(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('transfer');
              setError(null);
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'transfer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Pindah</span>
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-left">
          
          {/* Big Amount Input */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
              Nominal Transaksi (IDR)
            </span>
            <div className="flex items-center justify-center">
              <span className="text-xl font-bold text-stone-400 mr-1.5">Rp</span>
              <input
                type="text"
                value={amountStr ? Number(amountStr).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAmountStr(val);
                }}
                placeholder="0"
                autoFocus
                className="w-full text-center text-3xl font-black text-stone-900 bg-transparent focus:outline-none"
              />
            </div>

            {/* Quick Chips (+10k, +20k, +50k, +100k) */}
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-stone-200/60 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => addQuickAmount(10000)}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 active:scale-95 transition"
              >
                +10rb
              </button>
              <button
                type="button"
                onClick={() => addQuickAmount(25000)}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 active:scale-95 transition"
              >
                +25rb
              </button>
              <button
                type="button"
                onClick={() => addQuickAmount(50000)}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 active:scale-95 transition"
              >
                +50rb
              </button>
              <button
                type="button"
                onClick={() => addQuickAmount(100000)}
                className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 active:scale-95 transition"
              >
                +100rb
              </button>
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2 py-1 rounded-lg bg-stone-200 text-[11px] font-bold text-stone-600 active:scale-95 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Categories Pill Grid (if Expense or Income) */}
          {mode === 'expense' && (
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                Kategori Pos Belanja
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto py-1">
                {commonCategories.map(cat => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mode === 'income' && (
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                Sumber Pemasukan
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INCOME_SOURCES.map(src => {
                  const isSelected = category === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setCategory(src)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {src}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kantong Selector */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                {mode === 'transfer' ? 'Dari Kantong' : mode === 'income' ? 'Masuk Kantong' : 'Potong Kantong'}
              </label>
              <select
                value={pocketId}
                onChange={(e) => setPocketId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 font-semibold bg-white text-stone-800 text-xs"
              >
                {pockets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {mode === 'transfer' ? (
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Ke Kantong Tujuan
                </label>
                <select
                  value={destPocketId}
                  onChange={(e) => setDestPocketId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-semibold bg-white text-stone-800 text-xs"
                >
                  {pockets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-semibold bg-white text-stone-800 text-xs"
                />
              </div>
            )}
          </div>

          {/* 8 Lucky Cat Moods (if Expense) */}
          {mode === 'expense' && (
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-amber-500" />
                <span>Konteks Emosi Transaksi:</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MOODS.map(m => {
                  const isSelected = mood === m.type;
                  return (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setMood(m.type)}
                      className={`p-1.5 rounded-xl text-center border text-xs transition flex items-center justify-center gap-1 ${
                        isSelected
                          ? `${m.bg} ring-2 ring-rose-500 font-bold scale-[1.02]`
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <span className="text-base">{m.emoji}</span>
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catatan Singkat */}
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Catatan Singkat (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Beli sayur, Kirim ibu..."
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Big Thumb-Friendly Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-md shadow-rose-600/25 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Simpan Catatan</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
