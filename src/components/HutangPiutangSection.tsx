import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  Calendar,
  Wallet
} from 'lucide-react';
import type { DebtLoan, Pocket } from '../types';
import { db } from '../db';
import { formatIDR, formatDateIndo, getTodayDateStr } from '../utils/formatters';

interface HutangPiutangSectionProps {
  debts: DebtLoan[];
  pockets: Pocket[];
  onDataChanged: () => void;
}

export const HutangPiutangSection: React.FC<HutangPiutangSectionProps> = ({
  debts,
  pockets,
  onDataChanged
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [type, setType] = useState<'debt' | 'loan'>('debt');
  const [personName, setPersonName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [pocketId, setPocketId] = useState(pockets[0]?.id || 'pkt-kas-umum');
  const [dueDate, setDueDate] = useState(getTodayDateStr());
  const [note, setNote] = useState('');

  const todayStr = getTodayDateStr();

  // Aggregate stats
  let totalActiveDebt = 0;
  let totalActiveLoan = 0;
  let overdueCount = 0;

  for (const d of debts) {
    if (d.status === 'unpaid') {
      if (d.type === 'debt') totalActiveDebt += d.amount;
      else totalActiveLoan += d.amount;

      if (d.dueDate < todayStr) overdueCount += 1;
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Math.round(Number(amountStr) || 0);
    if (amt <= 0 || !personName.trim()) return;

    const newEntry: DebtLoan = {
      id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      personName: personName.trim(),
      amount: amt,
      pocketId,
      dueDate,
      status: 'unpaid',
      note: note.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    await db.debts.add(newEntry);
    setPersonName('');
    setAmountStr('');
    setNote('');
    setShowAddModal(false);
    onDataChanged();
  };

  const handleToggleStatus = async (item: DebtLoan) => {
    const isNowPaid = item.status === 'unpaid';
    await db.debts.update(item.id, {
      status: isNowPaid ? 'paid' : 'unpaid',
      paidDate: isNowPaid ? getTodayDateStr() : undefined
    });
    onDataChanged();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus catatan hutang/piutang bersama ${name}?`)) {
      await db.debts.delete(id);
      onDataChanged();
    }
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Pencatatan Hutang & Piutang
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Pantau kewajiban hutang dan hak tagih piutang Anda.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-sm shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Baru</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            Total Hutang Aktif (Kewajiban)
          </span>
          <p className="text-2xl sm:text-3xl font-black text-stone-900">{formatIDR(totalActiveDebt)}</p>
          <p className="text-[11px] text-stone-400">Masuk sebagai pengurang kekayaan bersih</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Total Piutang Aktif (Tagihan)
          </span>
          <p className="text-2xl sm:text-3xl font-black text-stone-900">{formatIDR(totalActiveLoan)}</p>
          <p className="text-[11px] text-stone-400">Uang Anda yang dipinjam pihak lain</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Lewat Jatuh Tempo (Overdue)
          </span>
          <p className="text-2xl sm:text-3xl font-black text-amber-900">{overdueCount} Tagihan</p>
          <p className="text-[11px] text-stone-400">Segera tindak lanjuti sebelum lupa</p>
        </div>
      </div>

      {/* Debt / Loan List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-stone-900">
          Daftar Catatan ({debts.length})
        </h3>

        {debts.length === 0 ? (
          <div className="text-center py-10 text-stone-400 text-xs">
            Tidak ada catatan hutang atau piutang. Alhamdulillah!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold uppercase text-[10px] tracking-wider border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Pihak Terkait</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {debts.map(item => {
                  const isOverdue = item.status === 'unpaid' && item.dueDate < todayStr;
                  const pocket = pockets.find(p => p.id === item.pocketId);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80">
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                          item.type === 'debt'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.type === 'debt' ? 'Hutang (Kewajiban)' : 'Piutang (Pinjaman)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-bold text-stone-900 block">{item.personName}</span>
                        {item.note && <span className="text-[11px] text-stone-400 block">{item.note}</span>}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-stone-600'}`}>
                          {formatDateIndo(item.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-rose-600 font-bold">
                            ⚠️ Terlewat!
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right whitespace-nowrap font-extrabold text-stone-900">
                        {formatIDR(item.amount)}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition ${
                            item.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.status === 'paid' ? 'Lunas' : 'Belum Lunas'}</span>
                        </button>
                        {item.paidDate && (
                          <span className="block text-[9px] text-stone-400 mt-0.5">
                            Lunas: {formatDateIndo(item.paidDate)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDelete(item.id, item.personName)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Catat Hutang / Piutang Baru
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('debt')}
                  className={`py-2 px-3 rounded-xl font-bold text-center border ${
                    type === 'debt'
                      ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Hutang (Saya Berhutang)
                </button>
                <button
                  type="button"
                  onClick={() => setType('loan')}
                  className={`py-2 px-3 rounded-xl font-bold text-center border ${
                    type === 'loan'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  Piutang (Orang Berhutang)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Pihak / Orang</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="Contoh: Kakak, Teman Kantor, Bank XYZ"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Contoh: 1500000"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan / Alasan (Opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Pinjaman renovasi kamar mandi"
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
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
