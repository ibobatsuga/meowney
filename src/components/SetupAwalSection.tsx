import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  BadgePercent, 
  Save, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  ArrowRight,
  Info,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import type { BudgetSetup, AllocationItem, UserProfile } from '../types';
import { 
  getProfileBasedAllocations,
  db 
} from '../db';
import { formatIDR, formatMonthYear } from '../utils/formatters';

interface SetupAwalSectionProps {
  currentMonth: string;
  profile?: UserProfile;
  onSetupSaved: () => void;
  onGoToDashboard: () => void;
}

export const SetupAwalSection: React.FC<SetupAwalSectionProps> = ({
  currentMonth,
  profile,
  onSetupSaved,
  onGoToDashboard,
}) => {
  const [incomeInput, setIncomeInput] = useState<string>('');
  const [familySplit, setFamilySplit] = useState<number>(70); // % of income for family
  const [personalSplit, setPersonalSplit] = useState<number>(30); // % of income for personal

  const [familyItems, setFamilyItems] = useState<AllocationItem[]>([]);
  const [personalItems, setPersonalItems] = useState<AllocationItem[]>([]);

  const [existingSetup, setExistingSetup] = useState<BudgetSetup | null>(null);
  const [allSetups, setAllSetups] = useState<BudgetSetup[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profileAllocations = getProfileBasedAllocations(
    profile?.maritalStatus || 'married_with_kids',
    profile ? profile.isSandwich : true
  );

  // Initialize or load setup for currentMonth
  useEffect(() => {
    loadSetupData();
  }, [currentMonth, profile]);

  const loadSetupData = async () => {
    const setup = await db.setups.get(currentMonth);
    const setups = await db.setups.toArray();
    setAllSetups(setups.sort((a, b) => b.month.localeCompare(a.month)));

    if (setup) {
      setExistingSetup(setup);
      setIncomeInput(setup.income.toString());
      setFamilySplit(setup.familyPercentage ?? profileAllocations.familySplit);
      setPersonalSplit(setup.personalPercentage ?? profileAllocations.personalSplit);
      setFamilyItems(setup.familyAllocation);
      setPersonalItems(setup.personalAllocation);
    } else {
      setExistingSetup(null);
      setIncomeInput(profile?.monthlyIncomeEstimate ? String(profile.monthlyIncomeEstimate) : '');
      setFamilySplit(profileAllocations.familySplit);
      setPersonalSplit(profileAllocations.personalSplit);

      // Initialize default allocation items based on User Profile
      const fam = profileAllocations.familyItems.map((item, idx) => ({
        id: `fam-${idx}-${Date.now()}`,
        name: item.name,
        percentage: item.percentage,
        amount: 0
      }));
      const per = profileAllocations.personalItems.map((item, idx) => ({
        id: `per-${idx}-${Date.now()}`,
        name: item.name,
        percentage: item.percentage,
        amount: 0
      }));
      setFamilyItems(fam);
      setPersonalItems(per);
    }
  };

  const applyProfileTemplate = () => {
    if (confirm(`Terapkan template alokasi untuk persona ${profile ? (profile.isSandwich ? 'Sandwich Gen' : 'Bebas Sandwich') : 'Standar'}?`)) {
      setFamilySplit(profileAllocations.familySplit);
      setPersonalSplit(profileAllocations.personalSplit);

      const fam = profileAllocations.familyItems.map((item, idx) => ({
        id: `fam-tmpl-${idx}-${Date.now()}`,
        name: item.name,
        percentage: item.percentage,
        amount: 0
      }));
      const per = profileAllocations.personalItems.map((item, idx) => ({
        id: `per-tmpl-${idx}-${Date.now()}`,
        name: item.name,
        percentage: item.percentage,
        amount: 0
      }));
      setFamilyItems(fam);
      setPersonalItems(per);
      setSuccessMessage('Template sesuai profil berhasil diterapkan ke form!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Recalculate amounts whenever income or percentages change
  const numericIncome = Math.round(Number(incomeInput) || 0);
  const familyBudgetTotal = Math.round((numericIncome * familySplit) / 100);
  const personalBudgetTotal = Math.round((numericIncome * personalSplit) / 100);

  const totalFamilyPercentage = familyItems.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
  const totalPersonalPercentage = personalItems.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);

  const isFamilyValid = totalFamilyPercentage === 100;
  const isPersonalValid = totalPersonalPercentage === 100;
  const isSplitValid = familySplit + personalSplit === 100;

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setIncomeInput(val);
    setValidationError(null);
  };

  const handleFamilyPercentageChange = (id: string, newPercent: number) => {
    setFamilyItems(items =>
      items.map(item =>
        item.id === id ? { ...item, percentage: newPercent } : item
      )
    );
  };

  const handlePersonalPercentageChange = (id: string, newPercent: number) => {
    setPersonalItems(items =>
      items.map(item =>
        item.id === id ? { ...item, percentage: newPercent } : item
      )
    );
  };

  const handleAddFamilyItem = () => {
    setFamilyItems(prev => [
      ...prev,
      { id: `fam-${Date.now()}`, name: 'Pos Lapis 1 Baru', percentage: 0, amount: 0 }
    ]);
  };

  const handleAddPersonalItem = () => {
    setPersonalItems(prev => [
      ...prev,
      { id: `per-${Date.now()}`, name: 'Pos Personal Baru', percentage: 0, amount: 0 }
    ]);
  };

  const handleRemoveFamilyItem = (id: string) => {
    setFamilyItems(prev => prev.filter(i => i.id !== id));
  };

  const handleRemovePersonalItem = (id: string) => {
    setPersonalItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSaveSetup = async () => {
    setValidationError(null);
    setSuccessMessage(null);

    if (numericIncome <= 0) {
      setValidationError('Estimasi penghasilan bulanan harus diisi dengan angka lebih dari 0.');
      return;
    }

    if (!isSplitValid) {
      setValidationError(`Total pembagian keluarga (${familySplit}%) dan personal (${personalSplit}%) harus berjumlah 100%.`);
      return;
    }

    if (!isFamilyValid) {
      setValidationError(`Total alokasi lapis pertama saat ini ${totalFamilyPercentage}%. Harus pas 100%.`);
      return;
    }

    if (!isPersonalValid) {
      setValidationError(`Total alokasi personal saat ini ${totalPersonalPercentage}%. Harus pas 100%.`);
      return;
    }

    // Calculate final integer IDR amounts
    const updatedFamilyItems = familyItems.map(item => ({
      ...item,
      amount: Math.round((familyBudgetTotal * item.percentage) / 100)
    }));

    const updatedPersonalItems = personalItems.map(item => ({
      ...item,
      amount: Math.round((personalBudgetTotal * item.percentage) / 100)
    }));

    const newSetup: BudgetSetup = {
      month: currentMonth,
      income: numericIncome,
      familyPercentage: familySplit,
      personalPercentage: personalSplit,
      familyAllocation: updatedFamilyItems,
      personalAllocation: updatedPersonalItems,
      createdAt: existingSetup?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.setups.put(newSetup);
    setExistingSetup(newSetup);
    setSuccessMessage(`Setup anggaran bulan ${formatMonthYear(currentMonth)} berhasil disimpan!`);
    onSetupSaved();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleDeleteSetup = async (monthToDelete: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus setup anggaran bulan ${formatMonthYear(monthToDelete)}?`)) {
      await db.setups.delete(monthToDelete);
      if (monthToDelete === currentMonth) {
        setExistingSetup(null);
      }
      loadSetupData();
      onSetupSaved();
    }
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title & History Toggle */}
      <div className="flex flex-col gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Setup Alokasi Anggaran
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {formatMonthYear(currentMonth)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Bagi porsi pendapatan secara proporsional sesuai kebutuhan hidup dan masa depan Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={applyProfileTemplate}
            title="Terapkan pos & persentase bawaan profil persona"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            <span>Template Profil</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition"
          >
            <History className="w-4 h-4 text-stone-500" />
            <span>{showHistory ? 'Tutup' : `Riwayat (${allSetups.length})`}</span>
          </button>

          {existingSetup && (
            <button
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition shadow-sm ml-auto"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Setup History Drawer/Modal */}
      {showHistory && (
        <div className="bg-stone-100/80 rounded-2xl p-5 border border-stone-300">
          <h3 className="text-sm font-bold text-stone-800 mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            Riwayat Setup Per Bulan
          </h3>
          {allSetups.length === 0 ? (
            <p className="text-xs text-stone-500">Belum ada riwayat setup yang tersimpan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allSetups.map(s => (
                <div key={s.month} className="bg-white p-3.5 rounded-xl border border-stone-200 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold text-stone-900">{formatMonthYear(s.month)}</p>
                    <p className="text-xs text-stone-500">Penghasilan: {formatIDR(s.income)}</p>
                    <p className="text-[10px] text-stone-400">
                      Lapis 1 {s.familyPercentage}% • Personal {s.personalPercentage}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteSetup(s.month)}
                      title="Hapus setup bulan ini"
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Step 1: Input Penghasilan */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Langkah 1</span>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              Estimasi Penghasilan Bulanan
            </h3>
            <p className="text-xs text-stone-500">
              Total gaji pokok, tunjangan, dan estimasi pemasukan pasti bulan ini.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-500">
                Rp
              </span>
              <input
                type="text"
                value={incomeInput ? Number(incomeInput).toLocaleString('id-ID') : ''}
                onChange={handleIncomeChange}
                placeholder="Contoh: 12.000.000"
                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-stone-200 focus:outline-none focus:border-rose-500 text-lg font-extrabold text-stone-900 transition"
              />
            </div>
            {numericIncome > 0 && (
              <p className="text-[11px] text-stone-500 mt-1 text-right">
                Terbaca: {formatIDR(numericIncome)}
              </p>
            )}
          </div>
        </div>

        {/* Pembagian Dua Lapis: Slider */}
        <div className="border-t border-stone-100 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-bold text-stone-700">Rasio Pembagian Pokok:</span>
              <p className="text-xs text-stone-500">
                Sesuaikan porsi lapis 1 (komitmen/keluarga) vs lapis 2 (personal & tabungan masa depan).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Lapis 1: {familySplit}% ({formatIDR(familyBudgetTotal)})
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Lapis 2: {personalSplit}% ({formatIDR(personalBudgetTotal)})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={familySplit}
              onChange={(e) => {
                const f = parseInt(e.target.value, 10);
                setFamilySplit(f);
                setPersonalSplit(100 - f);
              }}
              className="w-full accent-rose-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>0% Lapis 1 (100% Personal)</span>
              <span>50:50 Seimbang</span>
              <span>100% Lapis 1 (0% Personal)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Alokasi Lapis 1 */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Lapis Pertama</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isFamilyValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Total: {totalFamilyPercentage}% / 100%
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              {profileAllocations.layer1Label} ({familySplit}% = {formatIDR(familyBudgetTotal)})
            </h3>
            <p className="text-xs text-stone-500">
              Kewajiban pokok dan komitmen yang harus dipenuhi terlebih dahulu.
            </p>
          </div>
          <button
            onClick={handleAddFamilyItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pos</span>
          </button>
        </div>

        <div className="space-y-3">
          {familyItems.map((item) => {
            const itemRupiah = Math.round((familyBudgetTotal * (item.percentage || 0)) / 100);
            return (
              <div key={item.id} className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFamilyItems(prev => prev.map(i => i.id === item.id ? { ...i, name: newName } : i));
                    }}
                    className="w-full bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-b focus:border-rose-500"
                  />
                  <span className="text-xs font-semibold text-stone-500 block mt-0.5">
                    {formatIDR(itemRupiah)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-stone-300 rounded-xl bg-white px-2 py-1 shadow-2xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.percentage === 0 ? '' : item.percentage}
                      onChange={(e) => handleFamilyPercentageChange(item.id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-10 text-center text-xs font-bold text-stone-900 focus:outline-none"
                    />
                    <span className="text-xs text-stone-400 font-semibold">%</span>
                  </div>

                  <button
                    onClick={() => handleRemoveFamilyItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Hapus pos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!isFamilyValid && (
          <p className="text-xs text-rose-600 font-medium">
            ⚠️ Persentase pos lapis 1 harus berjumlah tepat 100% (saat ini {totalFamilyPercentage}%).
          </p>
        )}
      </div>

      {/* Step 3: Alokasi Lapis 2 - Personal */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Lapis Kedua</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isPersonalValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Total: {totalPersonalPercentage}% / 100%
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 mt-0.5">
              {profileAllocations.layer2Label} ({personalSplit}% = {formatIDR(personalBudgetTotal)})
            </h3>
            <p className="text-xs text-stone-500">
              Kebutuhan mandiri, tabungan pribadi, investasi, self-reward, dan healing yang berhak Anda nikmati.
            </p>
          </div>
          <button
            onClick={handleAddPersonalItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pos</span>
          </button>
        </div>

        <div className="space-y-3">
          {personalItems.map((item) => {
            const itemRupiah = Math.round((personalBudgetTotal * (item.percentage || 0)) / 100);
            return (
              <div key={item.id} className="p-3.5 rounded-2xl border border-stone-200 bg-amber-50/30 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setPersonalItems(prev => prev.map(i => i.id === item.id ? { ...i, name: newName } : i));
                    }}
                    className="w-full bg-transparent font-bold text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-b focus:border-amber-500"
                  />
                  <span className="text-xs font-semibold text-stone-500 block mt-0.5">
                    {formatIDR(itemRupiah)}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-stone-300 rounded-xl bg-white px-2 py-1 shadow-2xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.percentage === 0 ? '' : item.percentage}
                      onChange={(e) => handlePersonalPercentageChange(item.id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-10 text-center text-xs font-bold text-stone-900 focus:outline-none"
                    />
                    <span className="text-xs text-stone-400 font-semibold">%</span>
                  </div>

                  <button
                    onClick={() => handleRemovePersonalItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Hapus pos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {!isPersonalValid && (
          <p className="text-xs text-rose-600 font-medium">
            ⚠️ Persentase pos personal harus berjumlah tepat 100% (saat ini {totalPersonalPercentage}%).
          </p>
        )}
      </div>

      {/* Save Button & Summary Bar */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-800">
              Total Rencana Anggaran: {formatIDR(numericIncome)}
            </p>
            <p className="text-[11px] text-stone-500">
              Lapis 1 {familySplit}% ({formatIDR(familyBudgetTotal)}) + Lapis 2 {personalSplit}% ({formatIDR(personalBudgetTotal)})
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSetup}
          disabled={!isFamilyValid || !isPersonalValid || numericIncome <= 0}
          className={`px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition flex items-center gap-2 ${
            isFamilyValid && isPersonalValid && numericIncome > 0
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 shadow-rose-600/20 cursor-pointer'
              : 'bg-stone-300 cursor-not-allowed text-stone-500'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>Simpan Setup Bulan Ini</span>
        </button>
      </div>

    </div>
  );
};
