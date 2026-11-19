import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowRightLeft, 
  Target, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import type { Pocket, Transaction } from '../../types';
import { db } from '../../db';
import { formatIDR, formatDateIndo } from '../../utils/formatters';
import { calculatePocketBalances } from '../../utils/calculator';

interface MobilePocketsProps {
  pockets: Pocket[];
  transactions: Transaction[];
  onDataChanged: () => void;
  onOpenQuickTransfer: () => void;
}

export const MobilePockets: React.FC<MobilePocketsProps> = ({
  pockets,
  transactions,
  onDataChanged,
  onOpenQuickTransfer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPocketName, setNewPocketName] = useState('');
  const [newPocketTarget, setNewPocketTarget] = useState('');

  const pocketBalances = calculatePocketBalances(pockets, transactions);
  let totalLiquid = 0;
  for (const b of pocketBalances.values()) {
    totalLiquid += b.balance;
  }

  const handleAddPocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPocketName.trim()) return;

    await db.pockets.add({
      id: `pkt-m-${Date.now()}`,
      name: newPocketName.trim(),
      type: 'goal',
      targetAmount: newPocketTarget ? Number(newPocketTarget) : undefined,
      isDefault: false
    });

    setNewPocketName('');
    setNewPocketTarget('');
    setShowAddModal(false);
    onDataChanged();
  };

  const handleDeletePocket = async (pocket: Pocket) => {
    if (pocket.isDefault) {
      alert('Kantong utama sistem tidak dapat dihapus.');
      return;
    }
    if (confirm(`Hapus kantong ${pocket.name}?`)) {
      await db.pockets.delete(pocket.id);
      onDataChanged();
    }
  };

  return (
    <div className="space-y-4 pb-20 text-left max-w-md mx-auto">
      
      {/* Header Total */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-5 text-white flex items-center justify-between shadow-md">
        <div>
          <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
            Total Seluruh Kantong Kas
          </span>
          <p className="text-2xl font-black mt-0.5">{formatIDR(totalLiquid)}</p>
          <span className="text-[10px] text-stone-400">{pockets.length} kantong aktif</span>
        </div>

        <button
          onClick={onOpenQuickTransfer}
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Pindah</span>
        </button>
      </div>

      {/* Action Add */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
          Daftar Kantong Uang
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold text-rose-600 flex items-center gap-1 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Kantong</span>
        </button>
      </div>

      {/* Pockets List */}
      <div className="space-y-3">
        {pockets.map(p => {
          const bal = pocketBalances.get(p.id)?.balance || 0;
          const target = p.targetAmount || 0;
          const hasTarget = target > 0;
          const percent = hasTarget ? Math.min(100, Math.round((bal / target) * 100)) : 0;

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">👛</span>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{p.name}</h4>
                    <span className="text-[10px] text-stone-400 uppercase font-medium">{p.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-sm font-black ${bal >= 0 ? 'text-stone-900' : 'text-rose-600'}`}>
                    {formatIDR(bal)}
                  </span>
                  {!p.isDefault && (
                    <button
                      onClick={() => handleDeletePocket(p)}
                      className="p-1 text-stone-300 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {hasTarget && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-500" />
                      Target: {formatIDR(target)}
                    </span>
                    <span className="font-bold text-stone-800">{percent}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${bal >= target ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-stone-900">
              Tambah Kantong Baru
            </h3>
            <form onSubmit={handleAddPocket} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Kantong</label>
                <input
                  type="text"
                  value={newPocketName}
                  onChange={(e) => setNewPocketName(e.target.value)}
                  placeholder="Contoh: Tabungan Kurban"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Target Nominal (Opsional)</label>
                <input
                  type="number"
                  value={newPocketTarget}
                  onChange={(e) => setNewPocketTarget(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-stone-900 text-white font-bold"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
