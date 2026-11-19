import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  Target, 
  Sparkles, 
  TrendingUp, 
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import type { Pocket, Transaction } from '../types';
import { db } from '../db';
import { formatIDR, formatDateIndo } from '../utils/formatters';
import { calculatePocketBalances } from '../utils/calculator';

interface KantongUangSectionProps {
  pockets: Pocket[];
  transactions: Transaction[];
  onDataChanged: () => void;
  onNavigateToInput: () => void;
}

export const KantongUangSection: React.FC<KantongUangSectionProps> = ({
  pockets,
  transactions,
  onDataChanged,
  onNavigateToInput
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState<Pocket | null>(null);

  // Add Pocket Form
  const [newPocketName, setNewPocketName] = useState('');
  const [newPocketType, setNewPocketType] = useState<Pocket['type']>('goal');
  const [newPocketTarget, setNewPocketTarget] = useState('');
  const [newPocketDate, setNewPocketDate] = useState('');

  // Edit Goal Form
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDate, setGoalDate] = useState('');

  const pocketBalances = calculatePocketBalances(pockets, transactions);

  let totalLiquid = 0;
  for (const b of pocketBalances.values()) {
    totalLiquid += b.balance;
  }

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPocketName.trim()) return;

    const newPocket: Pocket = {
      id: `pkt-custom-${Date.now()}`,
      name: newPocketName.trim(),
      type: newPocketType,
      targetAmount: newPocketTarget ? Number(newPocketTarget) : undefined,
      targetDate: newPocketDate || undefined,
      color: 'amber',
      isDefault: false
    };

    await db.pockets.add(newPocket);
    setNewPocketName('');
    setNewPocketTarget('');
    setNewPocketDate('');
    setShowAddModal(false);
    onDataChanged();
  };

  const handleSaveGoal = async () => {
    if (!showGoalModal) return;
    const targetAmt = Number(goalAmount) || undefined;
    await db.pockets.update(showGoalModal.id, {
      targetAmount: targetAmt,
      targetDate: goalDate || undefined
    });
    setShowGoalModal(null);
    onDataChanged();
  };

  const handleDeletePocket = async (pocket: Pocket) => {
    if (pocket.isDefault) {
      alert('Kantong bawaan sistem tidak dapat dihapus.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus kantong "${pocket.name}"?`)) {
      await db.pockets.delete(pocket.id);
      onDataChanged();
    }
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Kantong Uang & Goal Tracker
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Pisahkan saldo belanja harian, tabungan impian, dan dana darurat agar tidak tercampur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kantong Baru</span>
          </button>
        </div>
      </div>

      {/* Aggregate Balance Banner (FR-08: Jumlah saldo semua kantong sama dengan saldo keseluruhan) */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            Total Saldo Kas Teragregasi (Seluruh Kantong)
          </span>
          <p className="text-3xl sm:text-4xl font-black mt-1">
            {formatIDR(totalLiquid)}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {pockets.length} kantong aktif • Single source of truth perhitungan
          </p>
        </div>

        <button
          onClick={onNavigateToInput}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Pindah Dana Antar Kantong</span>
        </button>
      </div>

      {/* Pockets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pockets.map((pocket) => {
          const summary = pocketBalances.get(pocket.id);
          const balance = summary?.balance || 0;
          const target = pocket.targetAmount || 0;
          const hasGoal = target > 0;
          const percentGoal = hasGoal ? Math.min(100, Math.round((balance / target) * 100)) : 0;
          const isAchieved = hasGoal && balance >= target;

          return (
            <div
              key={pocket.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 hover:border-stone-300 shadow-sm transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{pocket.name}</h4>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
                        {pocket.type}
                      </span>
                    </div>
                  </div>

                  {!pocket.isDefault && (
                    <button
                      onClick={() => handleDeletePocket(pocket)}
                      className="p-1.5 text-stone-300 hover:text-rose-600 rounded-lg transition"
                      title="Hapus kantong kustom"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                    Saldo Berjalan
                  </span>
                  <p className={`text-2xl font-black ${balance >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
                    {formatIDR(balance)}
                  </p>
                </div>

                {/* Goal Progress (FR-22) */}
                {hasGoal ? (
                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium flex items-center gap-1">
                        <Target className="w-3 h-3 text-amber-500" />
                        Target: {formatIDR(target)}
                      </span>
                      <span className="font-bold text-stone-800">
                        {percentGoal}%
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAchieved ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percentGoal}%` }}
                      />
                    </div>

                    {pocket.targetDate && (
                      <p className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Jatuh tempo target: {formatDateIndo(pocket.targetDate)}
                      </p>
                    )}

                    {isAchieved && (
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Target Tercapai!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
                    Belum ada target nominal.
                  </div>
                )}
              </div>

              {/* Set / Edit Goal Button */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <button
                  onClick={() => {
                    setShowGoalModal(pocket);
                    setGoalAmount(pocket.targetAmount ? pocket.targetAmount.toString() : '');
                    setGoalDate(pocket.targetDate || '');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{hasGoal ? 'Ubah Target' : '+ Pasang Target'}</span>
                </button>

                <button
                  onClick={onNavigateToInput}
                  className="text-xs text-stone-500 hover:text-stone-900 font-medium"
                >
                  + Transaksi
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Custom Pocket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Tambah Kantong Uang Baru
            </h3>
            
            <form onSubmit={handleCreatePocket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Kantong</label>
                <input
                  type="text"
                  value={newPocketName}
                  onChange={(e) => setNewPocketName(e.target.value)}
                  placeholder="Contoh: Tabungan Kurban"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tipe Kantong</label>
                <select
                  value={newPocketType}
                  onChange={(e) => setNewPocketType(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-900"
                >
                  <option value="goal">Tabungan Impian (Goal)</option>
                  <option value="emergency">Dana Darurat</option>
                  <option value="spending">Dompet Belanja</option>
                  <option value="education">Pendidikan</option>
                  <option value="custom">Kustom / Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Nominal (Opsional)</label>
                <input
                  type="number"
                  value={newPocketTarget}
                  onChange={(e) => setNewPocketTarget(e.target.value)}
                  placeholder="Contoh: 15000000"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Tanggal (Opsional)</label>
                <input
                  type="date"
                  value={newPocketDate}
                  onChange={(e) => setNewPocketDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold"
                >
                  Simpan Kantong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Target Tabungan: {showGoalModal.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Nominal (Rupiah)</label>
                <input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="Contoh: 25000000"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Tanggal</label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowGoalModal(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-700"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow"
              >
                Simpan Target
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
