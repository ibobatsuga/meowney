import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Heart, 
  User, 
  ShieldCheck, 
  Layers, 
  Smile, 
  Wallet,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import type { MaritalStatus, UserProfile, BudgetSetup } from '../types';
import { db, getProfileBasedAllocations } from '../db';
import { formatIDR, getCurrentMonthStr } from '../utils/formatters';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  initialProfile?: UserProfile;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialProfile
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>(initialProfile?.name || '');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(initialProfile?.maritalStatus || 'single');
  const [isSandwich, setIsSandwich] = useState<boolean>(initialProfile ? initialProfile.isSandwich : true);
  const [incomeStr, setIncomeStr] = useState<string>(
    initialProfile?.monthlyIncomeEstimate ? String(initialProfile.monthlyIncomeEstimate) : '10000000'
  );
  const [applyToCurrentMonth, setApplyToCurrentMonth] = useState<boolean>(true);

  const numericIncome = Math.round(Number(incomeStr) || 10000000);
  const allocationTemplate = getProfileBasedAllocations(maritalStatus, isSandwich);

  const familyTotalRupiah = Math.round((numericIncome * allocationTemplate.familySplit) / 100);
  const personalTotalRupiah = Math.round((numericIncome * allocationTemplate.personalSplit) / 100);

  // Profile Title Label
  const getProfileBadge = () => {
    if (isSandwich) {
      if (maritalStatus === 'single') return { title: 'Single Sandwich', desc: 'Pejuang Mandiri Menopang Orang Tua & Saudara', emoji: '🥪' };
      if (maritalStatus === 'married') return { title: 'Pasangan Sandwich', desc: 'Menopang Pasangan & Orang Tua/Mertua', emoji: '🥪' };
      return { title: 'Pengelola Ganda Klasik', desc: 'Menanggung Anak, Pasangan, dan Orang Tua/Mertua Sekaligus', emoji: '🥪' };
    } else {
      if (maritalStatus === 'single') return { title: 'Ksatria Mandiri', desc: 'Fokus Mandiri & Membangun Aset Masa Depan', emoji: '🌟' };
      return { title: 'Keluarga Mandiri', desc: 'Fokus Utuh Pada Kesejahteraan Keluarga Inti', emoji: '🏡' };
    }
  };

  const badgeInfo = getProfileBadge();

  const handleFinishOnboarding = async () => {
    const finalProfile: UserProfile = {
      name: name.trim() || 'Teman Meowney',
      maritalStatus,
      isSandwich,
      monthlyIncomeEstimate: numericIncome,
      completedAt: new Date().toISOString()
    };

    // 1. Save or update settings in Dexie
    const currentSettings = await db.settings.get('current');
    if (currentSettings) {
      await db.settings.update('current', {
        profile: finalProfile,
        hasCompletedOnboarding: true
      });
    } else {
      await db.settings.put({
        id: 'current',
        casualGateEnabled: false,
        localEncryptionEnabled: false,
        overBudgetThreshold: 80,
        profile: finalProfile,
        hasCompletedOnboarding: true
      });
    }

    // 2. ALWAYS update current month setup if user wants (checked by default)
    if (applyToCurrentMonth && numericIncome > 0) {
      const curMonth = getCurrentMonthStr();

      const familyAllocation = allocationTemplate.familyItems.map((item, idx) => ({
        id: `fam-onb-${idx}-${Date.now()}`,
        name: item.name,
        percentage: item.percentage,
        amount: Math.round((familyTotalRupiah * item.percentage) / 100)
      }));

      const personalAllocation = allocationTemplate.personalItems.map((item, idx) => ({
        id: `per-onb-${idx}-${Date.now()}`,
        name: item.name,
        percentage: item.percentage,
        amount: Math.round((personalTotalRupiah * item.percentage) / 100)
      }));

      const newSetup: BudgetSetup = {
        month: curMonth,
        income: numericIncome,
        familyPercentage: allocationTemplate.familySplit,
        personalPercentage: allocationTemplate.personalSplit,
        familyAllocation,
        personalAllocation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.setups.put(newSetup);
    }

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 }
    });

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-left overflow-hidden">
        
        {/* Top Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-rose-100 p-1 flex items-center justify-center">
              <img src="/lucky-cat.png" alt="Lucky Cat JS" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold text-stone-900">
              Personalisasi Meowney
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  step === s ? 'w-6 bg-rose-600' : step > s ? 'w-3 bg-emerald-500' : 'w-3 bg-stone-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ================= STEP 1: NAMA & SAMBUTAN ================= */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-200">
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 p-1 mx-auto shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-white rounded-full p-2 flex items-center justify-center">
                  <img src="/lucky-cat.png" alt="Lucky Cat" className="w-full h-full object-contain" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Halo! Selamat Datang di Meowney 🐾
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto">
                Bantu Meowney mengenal situasi hidupmu agar alokasi pos anggaran langsung disesuaikan dengan kebutuhanmu.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">
                Siapa nama panggilanmu?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi, Rina, Alex..."
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-semibold text-stone-900"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut: Status Kehidupan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: STATUS PERNIKAHAN ================= */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-200">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Langkah 2 dari 4</span>
              <h3 className="text-xl font-black text-stone-900 mt-0.5">
                Bagaimana Status Kehidupanmu Saat Ini?
              </h3>
              <p className="text-xs text-stone-500">
                Pilih yang paling menggambarkan kondisi rumah tanggamu saat ini.
              </p>
            </div>

            <div className="space-y-3">
              {/* Single */}
              <div
                onClick={() => setMaritalStatus('single')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  maritalStatus === 'single'
                    ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <span className="text-2xl">🙋‍♂️</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Single (Belum Menikah)</h4>
                    {maritalStatus === 'single' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Mengelola penghasilan mandiri untuk kebutuhan pribadi, kost/tempat tinggal, dan masa depan.
                  </p>
                </div>
              </div>

              {/* Married without kids */}
              <div
                onClick={() => setMaritalStatus('married')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  maritalStatus === 'married'
                    ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <span className="text-2xl">💍</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Menikah (Belum Memiliki Anak)</h4>
                    {maritalStatus === 'married' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Mengelola anggaran rumah tangga bersama pasangan dan menyiapkan tabungan hunian bersama.
                  </p>
                </div>
              </div>

              {/* Married with kids */}
              <div
                onClick={() => setMaritalStatus('married_with_kids')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  maritalStatus === 'married_with_kids'
                    ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <span className="text-2xl">👶</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">Menikah & Memiliki Anak</h4>
                    {maritalStatus === 'married_with_kids' && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Menanggung biaya anak (sekolah, les, nutrisi), kebutuhan dapur keluarga, dan proteksi masa depan.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-2xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut: Tanggungan Keluarga</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: APAKAH SANDWICH GENERATION ================= */}
        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-200">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Langkah 3 dari 4</span>
              <h3 className="text-xl font-black text-stone-900 mt-0.5">
                Apakah Kamu Termasuk Generasi Sandwich?
              </h3>
              <p className="text-xs text-stone-500">
                Pilih secara jujur agar pos kiriman orang tua diatur proporsional.
              </p>
            </div>

            <div className="space-y-3">
              {/* YA SANDWICH */}
              <div
                onClick={() => setIsSandwich(true)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  isSandwich
                    ? 'border-rose-600 bg-rose-50/60 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <span className="text-3xl">🥪</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                      Ya, Saya Generasi Sandwich
                    </h4>
                    {isSandwich && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Dari penghasilanku, aku <strong>rutin menanggung / mengirim uang</strong> untuk orang tua, mertua, atau adik/keluarga besar.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-800">
                    Pos Kiriman Orang Tua & Sembako Keluarga Aktif Otomatis
                  </span>
                </div>
              </div>

              {/* BUKAN SANDWICH */}
              <div
                onClick={() => setIsSandwich(false)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                  !isSandwich
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <span className="text-3xl">🕊️</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-900">
                      Bukan, Saya Tidak Menanggung Orang Tua
                    </h4>
                    {!isSandwich && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Penghasilanku difokuskan penuh untuk kebutuhan mandiri atau keluarga inti saja tanpa kiriman wajib orang tua.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-800">
                    Fokus Maksimal pada Tabungan Mandiri, Investasi & Gaya Hidup
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-3 rounded-2xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut: Rekomendasi Template</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ESTIMASI PENGHASILAN & TEMPLATE ================= */}
        {step === 4 && (
          <div className="space-y-4 animate-in slide-in-from-right duration-200">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Langkah Terakhir</span>
              <h3 className="text-lg sm:text-xl font-black text-stone-900 mt-0.5">
                Template Anggaran Khusus Untukmu
              </h3>
              <p className="text-xs text-stone-500">
                Meowney telah menyiapkan rumus persentase yang disesuaikan dengan pilihanmu.
              </p>
            </div>

            {/* Profile Result Badge */}
            <div className="p-3 rounded-2xl bg-stone-100 border border-stone-200 flex items-center gap-3">
              <span className="text-2xl">{badgeInfo.emoji}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-stone-900">{badgeInfo.title}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                    {name || 'Teman Meowney'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">{badgeInfo.desc}</p>
              </div>
            </div>

            {/* Income Input */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estimasi Penghasilan Bulanan (IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400 text-xs">
                  Rp
                </span>
                <input
                  type="text"
                  value={incomeStr ? Number(incomeStr).toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^0-9]/g, '');
                    setIncomeStr(cleaned);
                  }}
                  placeholder="10.000.000"
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-stone-300 font-extrabold text-stone-900 text-sm sm:text-base focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Rincian Pos Template Baru */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2 text-xs max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-1.5">
                <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                  Daftar Pos yang Akan Dibuat:
                </span>
                <span className="text-[10px] font-semibold text-rose-600">
                  {allocationTemplate.familySplit}% : {allocationTemplate.personalSplit}%
                </span>
              </div>

              {/* Lapis 1 */}
              <div>
                <span className="text-[10px] font-bold text-rose-800 block mb-1">
                  🔹 {allocationTemplate.layer1Label} ({allocationTemplate.familySplit}% = {formatIDR(familyTotalRupiah)}):
                </span>
                <ul className="space-y-0.5 text-[11px] text-stone-600 pl-3 list-disc">
                  {allocationTemplate.familyItems.map(item => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold text-stone-800">{item.percentage}% ({formatIDR(Math.round(familyTotalRupiah * item.percentage / 100))})</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Lapis 2 */}
              <div className="pt-1.5 border-t border-stone-200/60">
                <span className="text-[10px] font-bold text-amber-800 block mb-1">
                  🔸 {allocationTemplate.layer2Label} ({allocationTemplate.personalSplit}% = {formatIDR(personalTotalRupiah)}):
                </span>
                <ul className="space-y-0.5 text-[11px] text-stone-600 pl-3 list-disc">
                  {allocationTemplate.personalItems.map(item => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-semibold text-stone-800">{item.percentage}% ({formatIDR(Math.round(personalTotalRupiah * item.percentage / 100))})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Checkbox Konfirmasi Terapkan */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 bg-rose-50/60 p-2.5 rounded-xl border border-rose-200">
              <input
                type="checkbox"
                checked={applyToCurrentMonth}
                onChange={(e) => setApplyToCurrentMonth(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-bold">
                Terapkan template alokasi & pos baru ini ke anggaran bulan berjalan
              </span>
            </label>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-3 rounded-2xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-sm shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simpan & Terapkan Perubahan!</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
