import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  PiggyBank, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  PieChart
} from 'lucide-react';
import type { Asset, AssetType, Pocket, DebtLoan, BudgetSetup } from '../types';
import { db } from '../db';
import { formatIDR } from '../utils/formatters';
import { calculateNetWorth, calculatePocketBalances } from '../utils/calculator';

interface AsetKekayaanSectionProps {
  assets: Asset[];
  pockets: Pocket[];
  debts: DebtLoan[];
  setup?: BudgetSetup;
  allTransactions: any[];
  onDataChanged: () => void;
}

export const AsetKekayaanSection: React.FC<AsetKekayaanSectionProps> = ({
  assets,
  pockets,
  debts,
  setup,
  allTransactions,
  onDataChanged
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('Investasi');
  const [valueStr, setValueStr] = useState('');
  const [note, setNote] = useState('');

  const pocketBalances = calculatePocketBalances(pockets, allTransactions);
  let totalLiquid = 0;
  for (const p of pocketBalances.values()) {
    totalLiquid += p.balance;
  }

  const netWorthData = calculateNetWorth(assets, debts, totalLiquid);

  // Emergency Fund calculations (FR-10)
  // Pocket: Dana Darurat (pkt-dana-darurat)
  const emergencyPocketBalance = pocketBalances.get('pkt-dana-darurat')?.balance || 0;
  const monthlySalary = setup?.income || 0;

  const ef1x = monthlySalary * 1;
  const ef3x = monthlySalary * 3;
  const ef6x = monthlySalary * 6;

  // Investment Pocket or Asset calculations
  let totalInvestmentValue = 0;
  for (const a of assets) {
    if (a.type === 'Investasi' || a.type === 'Emas') {
      totalInvestmentValue += a.value;
    }
  }

  // Asset Composition (FR-16 zero-state rule: percent only if totalAssets > 0, sums to 100%)
  const assetTypeMap: Record<string, number> = {
    'Kas & Tabungan': Math.max(0, totalLiquid),
  };
  for (const a of assets) {
    assetTypeMap[a.type] = (assetTypeMap[a.type] || 0) + a.value;
  }

  const totalCompositionSum = Object.values(assetTypeMap).reduce((a, b) => a + b, 0);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Math.round(Number(valueStr) || 0);
    if (!name.trim() || val <= 0) return;

    const newAsset: Asset = {
      id: `ast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      type,
      value: val,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    await db.assets.add(newAsset);
    setName('');
    setValueStr('');
    setNote('');
    setShowAddModal(false);
    onDataChanged();

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (confirm(`Hapus data aset "${asset.name}"?`)) {
      await db.assets.delete(asset.id);
      onDataChanged();
    }
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            Aset, Tabungan & Kekayaan Bersih
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Gambaran kekayaan Anda secara utuh: dana likuid, aset fisik, investasi, dikurangi beban hutang.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-sm shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* Net Worth Banner (FR-05 & FR-16) */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Total Kekayaan Bersih (Net Worth)
            </span>
            <p className="text-3xl sm:text-5xl font-black mt-1">
              {formatIDR(netWorthData.netWorth)}
            </p>
            <p className="text-xs text-stone-300 mt-1">
              Formula baku: Total Aset ({formatIDR(netWorthData.totalAssets)}) − Total Hutang Aktif ({formatIDR(netWorthData.totalActiveDebt)})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-stone-700 pt-4 md:pt-0 md:pl-6 text-xs">
            <div className="bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kas & Kantong</span>
              <span className="font-bold text-sm text-white">{formatIDR(netWorthData.liquidBalance)}</span>
            </div>
            <div className="bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Aset Non-Kas</span>
              <span className="font-bold text-sm text-white">{formatIDR(netWorthData.totalOtherAssets)}</span>
            </div>
            <div className="bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl">
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Kewajiban Hutang</span>
              <span className="font-bold text-sm text-rose-400">−{formatIDR(netWorthData.totalActiveDebt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiered Emergency Fund Tracker (FR-10) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-600" />
            <h3 className="text-lg font-bold text-stone-900">
              Tracker Dana Darurat Bertingkat
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Saldo Dana Darurat saat ini: <strong>{formatIDR(emergencyPocketBalance)}</strong> (Berdasarkan kantong "Dana Darurat").
          </p>
        </div>

        {monthlySalary <= 0 ? (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />
            <span>
              Milestone belum dapat dihitung karena estimasi penghasilan bulanan di Setup Awal belum diisi.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Level 1: 1x Gaji */}
            <div className={`p-4 rounded-2xl border transition-all ${
              emergencyPocketBalance >= ef1x
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-stone-50/80 border-stone-200'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    emergencyPocketBalance >= ef1x ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-200 text-stone-700'
                  }`}>
                    1
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Level 1: 1× Gaji Bulanan</h4>
                    <p className="text-[10px] sm:text-xs text-stone-500">Bantalan pertama darurat dasar</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm sm:text-base font-black text-stone-900">{formatIDR(ef1x)}</p>
                  {emergencyPocketBalance >= ef1x ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tercapai
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                      {Math.min(100, Math.round((emergencyPocketBalance / ef1x) * 100))}% • Dalam Proses
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mt-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((emergencyPocketBalance / ef1x) * 100))}%` }}
                />
              </div>
            </div>

            {/* Level 2: 3x Gaji */}
            <div className={`p-4 rounded-2xl border transition-all ${
              emergencyPocketBalance >= ef3x
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-stone-50/80 border-stone-200'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    emergencyPocketBalance >= ef3x ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-200 text-stone-700'
                  }`}>
                    2
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Level 2: 3× Gaji Bulanan</h4>
                    <p className="text-[10px] sm:text-xs text-stone-500">Bantalan aman cadangan keluarga</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm sm:text-base font-black text-stone-900">{formatIDR(ef3x)}</p>
                  {emergencyPocketBalance >= ef3x ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tercapai
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                      {Math.min(100, Math.round((emergencyPocketBalance / ef3x) * 100))}% • Dalam Proses
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mt-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((emergencyPocketBalance / ef3x) * 100))}%` }}
                />
              </div>
            </div>

            {/* Level 3: 6x Gaji */}
            <div className={`p-4 rounded-2xl border transition-all ${
              emergencyPocketBalance >= ef6x
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-stone-50/80 border-stone-200'
            }`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    emergencyPocketBalance >= ef6x ? 'bg-emerald-200 text-emerald-900' : 'bg-stone-200 text-stone-700'
                  }`}>
                    3
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Level 3: 6× Gaji Bulanan</h4>
                    <p className="text-[10px] sm:text-xs text-stone-500">Aman penuh & kebebasan psikologis</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm sm:text-base font-black text-stone-900">{formatIDR(ef6x)}</p>
                  {emergencyPocketBalance >= ef6x ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tercapai
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                      {Math.min(100, Math.round((emergencyPocketBalance / ef6x) * 100))}% • Dalam Proses
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mt-3">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((emergencyPocketBalance / ef6x) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tiered Investment Milestones (FR-10: 10jt & 50jt) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-stone-900">
              Milestone Portofolio Investasi & Emas
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Total aset investasi & emas saat ini: <strong>{formatIDR(totalInvestmentValue)}</strong>.
          </p>
        </div>

        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border transition-all ${
            totalInvestmentValue >= 10000000 ? 'bg-amber-50/70 border-amber-300' : 'bg-stone-50/80 border-stone-200'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs shrink-0">
                  🌱
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900">Milestone Pertama: Rp 10 Juta</h4>
                  <p className="text-[10px] sm:text-xs text-stone-500">Fondasi portofolio & emas awal</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm sm:text-base font-black text-stone-900">Rp 10.000.000</p>
                {totalInvestmentValue >= 10000000 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full mt-0.5">
                    Tercapai 🎉
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                    {Math.min(100, Math.round((totalInvestmentValue / 10000000) * 100))}% • {formatIDR(totalInvestmentValue)}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mt-3">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalInvestmentValue / 10000000) * 100))}%` }}
              />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border transition-all ${
            totalInvestmentValue >= 50000000 ? 'bg-amber-50/70 border-amber-300' : 'bg-stone-50/80 border-stone-200'
          }`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs shrink-0">
                  🚀
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900">Milestone Kedua: Rp 50 Juta</h4>
                  <p className="text-[10px] sm:text-xs text-stone-500">Akselerasi aset & kemandirian</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm sm:text-base font-black text-stone-900">Rp 50.000.000</p>
                {totalInvestmentValue >= 50000000 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full mt-0.5">
                    Tercapai 🚀
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-semibold block mt-0.5">
                    {Math.min(100, Math.round((totalInvestmentValue / 50000000) * 100))}% • {formatIDR(totalInvestmentValue)}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden mt-3">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalInvestmentValue / 50000000) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Asset Composition (FR-16) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-stone-900">
          Komposisi Aset ({formatIDR(totalCompositionSum)})
        </h3>

        {totalCompositionSum === 0 ? (
          <p className="text-xs text-stone-400 py-4">Komposisi belum dapat dihitung (total aset Rp0).</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(assetTypeMap).map(([aType, aVal]) => {
              if (aVal <= 0) return null;
              const percent = Math.round((aVal / totalCompositionSum) * 100);
              return (
                <div key={aType} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-800">{aType}</span>
                    <span className="text-stone-900 font-bold">{formatIDR(aVal)} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-stone-800 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assets List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-stone-900">
          Daftar Aset Terdata ({assets.length})
        </h3>

        {assets.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">
            Belum ada aset fisik atau investasi yang dicatat. Klik tombol "Tambah Aset" untuk mulai mencatat rumah, kendaraan, emas, atau reksadana Anda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(a => (
              <div key={a.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-400">{a.type}</span>
                  <h4 className="font-bold text-stone-900 text-sm">{a.name}</h4>
                  <p className="text-xs font-black text-stone-800 mt-1">{formatIDR(a.value)}</p>
                  {a.note && <p className="text-[10px] text-stone-500 mt-0.5">{a.note}</p>}
                </div>
                <button
                  onClick={() => handleDeleteAsset(a)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Tambah Aset Baru
            </h3>

            <form onSubmit={handleAddAsset} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nama Aset</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Logam Mulia Antam 10g, Motor Vario 2021"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Jenis Aset</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AssetType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs bg-white text-stone-900"
                >
                  <option value="Investasi">Investasi (Reksadana/Saham/SBN)</option>
                  <option value="Emas">Emas & Logam Mulia</option>
                  <option value="Kendaraan">Kendaraan</option>
                  <option value="Properti">Properti & Tanah</option>
                  <option value="Tabungan">Tabungan / Deposito Luar</option>
                  <option value="Barang">Barang Berharga Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Estimasi Nilai Pasar Saat Ini (Rupiah)</label>
                <input
                  type="number"
                  value={valueStr}
                  onChange={(e) => setValueStr(e.target.value)}
                  placeholder="Contoh: 14500000"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Beli tahun 2023 di Butik Antam"
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
                  Simpan Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
