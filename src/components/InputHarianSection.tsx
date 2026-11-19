import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  BadgeDollarSign, 
  AlertCircle, 
  Check, 
  RotateCcw,
  Tag,
  Calendar,
  AlertTriangle,
  Smile
} from 'lucide-react';
import type { 
  Transaction, 
  TransactionMode, 
  MoodType, 
  Pocket, 
  BudgetSetup, 
  Asset 
} from '../types';
import { 
  db, 
  EXPENSE_CATEGORIES, 
  INCOME_SOURCES, 
  MOODS 
} from '../db';
import { 
  formatIDR, 
  formatDateIndo, 
  getTodayDateStr, 
  formatMonthYear 
} from '../utils/formatters';
import { calculateMonthlySummary, calculatePlanVsActual } from '../utils/calculator';

interface InputHarianSectionProps {
  currentMonth: string;
  pockets: Pocket[];
  transactions: Transaction[];
  setup?: BudgetSetup;
  assets: Asset[];
  onTransactionsChanged: () => void;
}

export const InputHarianSection: React.FC<InputHarianSectionProps> = ({
  currentMonth,
  pockets,
  transactions,
  setup,
  assets,
  onTransactionsChanged
}) => {
  const [mode, setMode] = useState<TransactionMode>('expense');
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryOrSource, setCategoryOrSource] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [pocketId, setPocketId] = useState<string>(pockets[0]?.id || 'pkt-kas-umum');
  const [destinationPocketId, setDestinationPocketId] = useState<string>(pockets[1]?.id || 'pkt-dompet-belanja');
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>('Biasa');
  const [note, setNote] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterPocket, setFilterPocket] = useState<string>('all');

  // Edit Modal State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Undo Delete State (FR-07: Undo minimal 10 detik)
  const [deletedTx, setDeletedTx] = useState<Transaction | null>(null);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);

  // Form error & success alerts
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Budget calculations for real-time alert (FR-20)
  const monthSummary = calculateMonthlySummary(transactions, currentMonth);
  const planVsActual = calculatePlanVsActual(setup, monthSummary.expenseByCategory);

  // Reset inputs when switching mode (PRD AC: Berpindah tab mode mengosongkan nominal dan kolom mode sebelumnya)
  const handleModeChange = (newMode: TransactionMode) => {
    setMode(newMode);
    setAmountStr('');
    setFormError(null);
    setFormSuccess(null);
    if (newMode === 'expense') {
      setCategoryOrSource(EXPENSE_CATEGORIES[0]);
      setSelectedMood('Biasa');
    } else if (newMode === 'income') {
      setCategoryOrSource(INCOME_SOURCES[0]);
      setSelectedMood(undefined);
    } else if (newMode === 'transfer') {
      setSelectedMood(undefined);
      if (pockets.length > 1) {
        setPocketId(pockets[0].id);
        setDestinationPocketId(pockets[1].id);
      }
    } else if (newMode === 'asset_sale') {
      setSelectedMood(undefined);
      if (assets.length > 0) {
        setSelectedAssetId(assets[0].id);
      }
    }
  };

  // Undo timer effect
  useEffect(() => {
    if (undoCountdown > 0) {
      const timer = setTimeout(() => {
        setUndoCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (undoCountdown === 0 && deletedTx) {
      setDeletedTx(null);
    }
  }, [undoCountdown, deletedTx]);

  // Real-time budget warning for selected expense category (FR-20)
  const numericAmount = Math.round(Number(amountStr) || 0);
  const activeCategoryPlan = planVsActual.find(p => p.category === categoryOrSource);
  const willTotalSpend = (activeCategoryPlan?.actual || 0) + numericAmount;
  const isNearlyOver = activeCategoryPlan && activeCategoryPlan.planned > 0 &&
    (willTotalSpend / activeCategoryPlan.planned) >= 0.8 &&
    willTotalSpend <= activeCategoryPlan.planned;
  const isExceedingBudget = activeCategoryPlan && activeCategoryPlan.planned > 0 &&
    willTotalSpend > activeCategoryPlan.planned;

  // Date out of active month check
  const isDateOutsideMonth = !date.startsWith(currentMonth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (numericAmount <= 0) {
      setFormError('Nominal harus berupa angka lebih besar dari 0.');
      return;
    }

    if (mode === 'transfer') {
      if (pocketId === destinationPocketId) {
        setFormError('Kantong asal dan kantong tujuan tidak boleh sama.');
        return;
      }
    }

    const txMonth = date.slice(0, 7);

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      month: txMonth,
      mode,
      categoryOrSource: mode === 'transfer' ? 'Pindah Dana' : mode === 'asset_sale' ? 'Jual Aset' : categoryOrSource,
      amount: numericAmount,
      pocketId,
      destinationPocketId: mode === 'transfer' ? destinationPocketId : undefined,
      assetId: mode === 'asset_sale' ? selectedAssetId : undefined,
      mood: mode === 'expense' ? selectedMood : undefined,
      note: note.trim() || undefined,
      isRecurring,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If asset sale, optionally reduce the asset value
    if (mode === 'asset_sale' && selectedAssetId) {
      const asset = await db.assets.get(selectedAssetId);
      if (asset) {
        const remainingVal = Math.max(0, asset.value - numericAmount);
        await db.assets.update(selectedAssetId, { value: remainingVal, updatedAt: new Date().toISOString() });
      }
    }

    await db.transactions.add(newTx);
    setAmountStr('');
    setNote('');
    setFormSuccess('Transaksi berhasil ditambahkan!');
    onTransactionsChanged();
  };

  const handleDelete = async (tx: Transaction) => {
    if (confirm(`Hapus transaksi ${tx.categoryOrSource} sebesar ${formatIDR(tx.amount)}? Anda bisa membatalkannya dalam 10 detik.`)) {
      await db.transactions.delete(tx.id);
      setDeletedTx(tx);
      setUndoCountdown(10);
      onTransactionsChanged();
    }
  };

  const handleUndo = async () => {
    if (deletedTx) {
      await db.transactions.add(deletedTx);
      setDeletedTx(null);
      setUndoCountdown(0);
      onTransactionsChanged();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    if (editingTransaction.amount <= 0) {
      alert('Nominal harus lebih dari 0');
      return;
    }
    await db.transactions.put({
      ...editingTransaction,
      month: editingTransaction.date.slice(0, 7),
      updatedAt: new Date().toISOString()
    });
    setEditingTransaction(null);
    onTransactionsChanged();
  };

  // Filtered transactions list
  const filteredTransactions = transactions.filter(t => {
    // text search
    const matchesSearch = 
      t.categoryOrSource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // mode filter
    const matchesMode = filterMode === 'all' || t.mode === filterMode;

    // pocket filter
    const matchesPocket = 
      filterPocket === 'all' || 
      t.pocketId === filterPocket || 
      t.destinationPocketId === filterPocket;

    return matchesSearch && matchesMode && matchesPocket;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Input Transaksi & Riwayat
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Catat pengeluaran, pemasukan, mutasi antar kantong, atau pencairan aset dalam hitungan detik.
          </p>
        </div>
      </div>

      {/* Undo Toast Notification (FR-07) */}
      {deletedTx && undoCountdown > 0 && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-200 border border-stone-700">
          <div className="text-xs">
            <p className="font-bold">Transaksi Dihapus</p>
            <p className="text-stone-300">
              {deletedTx.categoryOrSource} ({formatIDR(deletedTx.amount)}) • Otomatis permanen dlm {undoCountdown}s
            </p>
          </div>
          <button
            onClick={handleUndo}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 transition shadow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Batalkan (Undo)</span>
          </button>
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        
        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-stone-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleModeChange('expense')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'expense'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Pengeluaran</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('income')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'income'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Pemasukan</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('transfer')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'transfer'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Pindah Dana</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('asset_sale')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              mode === 'asset_sale'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BadgeDollarSign className="w-4 h-4" />
            <span>Jual Aset</span>
          </button>
        </div>

        {/* Real-time Budget Warning Alerts (FR-20) */}
        {mode === 'expense' && isExceedingBudget && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Peringatan Budget:</strong> Pos <strong>{categoryOrSource}</strong> akan melebihi alokasi rencana ({formatIDR(activeCategoryPlan?.planned)}) setelah transaksi ini ({formatIDR(willTotalSpend)} / {Math.round((willTotalSpend / (activeCategoryPlan?.planned || 1)) * 100)}%).
            </span>
          </div>
        )}

        {mode === 'expense' && isNearlyOver && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Pos <strong>{categoryOrSource}</strong> sudah mendekati batas anggaran ({Math.round((willTotalSpend / (activeCategoryPlan?.planned || 1)) * 100)}% terpakai).
            </span>
          </div>
        )}

        {isDateOutsideMonth && (
          <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
            <span>
              Catatan: Tanggal yang dipilih ({date}) berada di luar bulan aktif ({formatMonthYear(currentMonth)}). Transaksi tetap dicatat sesuai tanggalnya.
            </span>
          </div>
        )}

        {formError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        {formSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {formSuccess}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm font-semibold text-stone-900"
              />
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Nominal (Rupiah)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rp
                </span>
                <input
                  type="text"
                  value={amountStr ? Number(amountStr).toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setAmountStr(cleaned);
                  }}
                  placeholder="0"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-extrabold text-stone-900"
                />
              </div>
            </div>

            {/* Mode-specific Fields */}
            {mode === 'expense' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Kategori</label>
                <select
                  value={categoryOrSource}
                  onChange={(e) => setCategoryOrSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm font-semibold text-stone-900 bg-white"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {/* Also show categories from setup if custom */}
                  {setup?.familyAllocation.map(f => (
                    !EXPENSE_CATEGORIES.includes(f.name) ? <option key={f.name} value={f.name}>{f.name} (Keluarga)</option> : null
                  ))}
                  {setup?.personalAllocation.map(p => (
                    !EXPENSE_CATEGORIES.includes(p.name) ? <option key={p.name} value={p.name}>{p.name} (Personal)</option> : null
                  ))}
                </select>
              </div>
            )}

            {mode === 'income' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Sumber Pemasukan</label>
                <select
                  value={categoryOrSource}
                  onChange={(e) => setCategoryOrSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-semibold text-stone-900 bg-white"
                >
                  {INCOME_SOURCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'asset_sale' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Pilih Aset yang Dijual</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm font-semibold text-stone-900 bg-white"
                >
                  {assets.length === 0 ? (
                    <option value="">Belum ada data aset tercatat</option>
                  ) : (
                    assets.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.type}) - Nilai: {formatIDR(a.value)}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Kantong Sumber */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                {mode === 'transfer' ? 'Dari Kantong Asal' : mode === 'asset_sale' || mode === 'income' ? 'Masuk ke Kantong' : 'Potong dari Kantong'}
              </label>
              <select
                value={pocketId}
                onChange={(e) => setPocketId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm font-semibold text-stone-900 bg-white"
              >
                {pockets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Kantong Tujuan (Transfer) */}
            {mode === 'transfer' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Ke Kantong Tujuan</label>
                <select
                  value={destinationPocketId}
                  onChange={(e) => setDestinationPocketId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm font-semibold text-stone-900 bg-white"
                >
                  {pockets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Catatan */}
            <div className={mode === 'expense' ? 'sm:col-span-2 lg:col-span-1' : ''}>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Catatan / Detail (Opsional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Belanja mingguan di pasar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm text-stone-900"
              />
            </div>

          </div>

          {/* Mood Selector (Pengeluaran - FR-06) */}
          {mode === 'expense' && (
            <div className="border-t border-stone-100 pt-4">
              <label className="block text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-amber-500" />
                <span>Bagaimana perasaan Anda saat mengeluarkan uang ini? (Konteks Emosi)</span>
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {MOODS.map(m => {
                  const isSelected = selectedMood === m.type;
                  return (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setSelectedMood(m.type)}
                      className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? `${m.bg} ring-2 ring-rose-500 scale-105 font-bold shadow-sm`
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-600">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span>Tandai sebagai tagihan / transaksi rutin bulanan (FR-21)</span>
            </label>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Transaksi</span>
            </button>
          </div>
        </form>

      </div>

      {/* Transactions History & Search Section (FR-07) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              Riwayat Transaksi ({filteredTransactions.length})
            </h3>
            <p className="text-xs text-stone-500">
              Cari catatan, filter per kantong, edit nominal atau hapus dengan fitur Undo.
            </p>
          </div>

          {/* Search bar & filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-700"
            >
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Pindah Dana</option>
              <option value="asset_sale">Jual Aset</option>
            </select>

            <select
              value={filterPocket}
              onChange={(e) => setFilterPocket(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs bg-white text-stone-700"
            >
              <option value="all">Semua Kantong</option>
              {pockets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">Belum ada transaksi yang sesuai.</p>
            <p className="text-xs text-stone-400 mt-1">Mulai catat transaksi pertama Anda pada form di atas!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Kategori / Deskripsi</th>
                  <th className="py-3 px-3">Kantong</th>
                  <th className="py-3 px-3">Mood</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.map(t => {
                  const srcPocket = pockets.find(p => p.id === t.pocketId);
                  const dstPocket = pockets.find(p => p.id === t.destinationPocketId);
                  const moodObj = MOODS.find(m => m.type === t.mood);

                  return (
                    <tr key={t.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap text-stone-500 font-medium">
                        {formatDateIndo(t.date)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            t.mode === 'expense' ? 'bg-rose-500' :
                            t.mode === 'income' ? 'bg-emerald-500' :
                            t.mode === 'transfer' ? 'bg-blue-500' : 'bg-amber-500'
                          }`} />
                          <div>
                            <span className="font-bold text-stone-900 block">
                              {t.categoryOrSource}
                            </span>
                            {t.note && (
                              <span className="text-[11px] text-stone-400 block">
                                {t.note}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-stone-600">
                        {t.mode === 'transfer' ? (
                          <span className="text-[11px]">
                            {srcPocket?.name || t.pocketId} → {dstPocket?.name || t.destinationPocketId}
                          </span>
                        ) : (
                          <span>{srcPocket?.name || t.pocketId}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {moodObj ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] ${moodObj.bg}`}>
                            <span>{moodObj.emoji}</span>
                            <span>{moodObj.label}</span>
                          </span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-right font-extrabold">
                        <span className={
                          t.mode === 'expense' ? 'text-rose-600' :
                          t.mode === 'income' ? 'text-emerald-600' :
                          t.mode === 'transfer' ? 'text-blue-600' : 'text-amber-600'
                        }>
                          {t.mode === 'expense' ? `-${formatIDR(t.amount)}` :
                           t.mode === 'income' ? `+${formatIDR(t.amount)}` :
                           formatIDR(t.amount)}
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setEditingTransaction(t)}
                            title="Edit transaksi"
                            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t)}
                            title="Hapus transaksi"
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Edit Transaksi
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={editingTransaction.date}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Kategori / Deskripsi</label>
                <input
                  type="text"
                  value={editingTransaction.categoryOrSource}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, categoryOrSource: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingTransaction.note || ''}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs"
                />
              </div>

              {editingTransaction.mode === 'expense' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Mood</label>
                  <select
                    value={editingTransaction.mood || ''}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, mood: e.target.value as MoodType })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
                  >
                    <option value="">Tanpa Mood</option>
                    {MOODS.map(m => (
                      <option key={m.type} value={m.type}>{m.emoji} {m.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
