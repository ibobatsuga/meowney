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
  CheckCircle2
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

  const numericIncome = Math.round(Number(incomeStr) || 0);
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

    // Save to settings
    await db.settings.update('current', {
      profile: finalProfile,
      hasCompletedOnboarding: true
    });

    // Check if current month setup already exists; if not, auto-generate template setup!
    const curMonth = getCurrentMonthStr();
    const existingSetup = await db.setups.get(curMonth);
    if (!existingSetup && numericIncome > 0) {
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
              Personalitasi Meowney
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
                Bantu Meowney mengenal situasi hidupmu agar perencanaan anggaran bisa disesuaikan khusus untukmu.
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
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
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
                Pilih yang paling menggambarkan kondisi rumah tanggamu.
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
                    Menghasilkan uang mandiri untuk kebutuhan pribadi, kost/tempat tinggal, dan tabungan masa depan.
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
                    Mengelola anggaran rumah tangga bersama pasangan dan menyiapkan hunian / masa depan bersama.
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
                    Menanggung biaya anak (SPP, les, nutrisi), kebutuhan dapur keluarga, dan perlindungan masa depan.
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
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
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
                Pilih jujur agar alokasi kiriman keluarga atau orang tua diatur proporsional.
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
                    Dari penghasilanku, aku <strong>rutin menanggung / mengirim uang</strong> untuk orang tua, mertua, atau adik/keluarga besar di luar kebutuhan diri sendiri.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-200/80 text-rose-800">
                    Pos Alokasi Kiriman Orang Tua & Keluarga Aktif Otomatis
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
                    Penghasilanku difokuskan penuh untuk kebutuhan mandiri atau keluarga inti saja, tanpa kewajiban kiriman rutin orang tua/saudara.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-800">
                    Fokus Maksimal pada Tabungan, Investasi & Kebutuhan Inti
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
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2"
              >
                <span>Lanjut: Estimasi Gaji & Template</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ESTIMASI PENGHASILAN & TEMPLATE ================= */}
        {step === 4 && (
          <div className="space-y-5 animate-in slide-in-from-right duration-200">
            <div>
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Langkah Terakhir</span>
              <h3 className="text-xl font-black text-stone-900 mt-0.5">
                Estimasi Penghasilan & Template Alokasi
              </h3>
              <p className="text-xs text-stone-500">
                Meowney menyiapkan rumus persentase yang disesuaikan khusus untuk profilmu.
              </p>
            </div>

            {/* Profile Result Badge */}
            <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 flex items-center gap-3">
              <span className="text-2xl">{badgeInfo.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
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
                Estimasi Penghasilan Bersih Bulanan (IDR)
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 font-extrabold text-stone-900 text-base focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Two-layer Split Preview */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <span className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">
                Rekomendasi Pembagian Alokasi Otomatis:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Keluarga / Komitmen Luar:</span>
                  <span className="font-bold text-rose-700">{allocationTemplate.familySplit}%</span>
                  <span className="block text-[11px] font-semibold text-stone-900 mt-0.5">
                    {formatIDR(familyTotalRupiah)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                  <span className="text-[10px] text-stone-500 block">Personal & Masa Depan:</span>
                  <span className="font-bold text-amber-700">{allocationTemplate.personalSplit}%</span>
                  <span className="block text-[11px] font-semibold text-stone-900 mt-0.5">
                    {formatIDR(personalTotalRupiah)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 italic">
                * Persentase dan pos pengeluaran tetap dapat Anda ubah bebas kapan saja di menu Setup Awal.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-3 rounded-2xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleFinishOnboarding}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-sm shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Gunakan Meowney!</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
