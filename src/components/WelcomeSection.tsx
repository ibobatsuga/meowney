import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Flame, 
  Smile, 
  Wallet, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Heart,
  Lock,
  Coffee
} from 'lucide-react';

interface WelcomeSectionProps {
  onStart: () => void;
  hasSetup: boolean;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onStart, hasSetup }) => {
  const features = [
    {
      icon: <Layers className="w-6 h-6 text-rose-600" />,
      title: 'Alokasi Dua Lapis',
      desc: 'Penghasilan dialokasikan dulu untuk keluarga (orang tua, anak, sembako, listrik), lalu sisanya untuk pos personal agar tak saling berebut.'
    },
    {
      icon: <Flame className="w-6 h-6 text-amber-500" />,
      title: 'Batas Belanja Harian Aman',
      desc: 'Ketahui angka aman yang boleh dibelanjakan hari ini (Safe Daily Spend) tanpa khawatir kehabisan uang di akhir bulan.'
    },
    {
      icon: <Smile className="w-6 h-6 text-emerald-600" />,
      title: 'Konteks Emosi pada Uang',
      desc: 'Tandai setiap pengeluaran dengan 8 mood (Senang, Stres, Galau, dll) untuk melihat apakah dompet bocor karena pelampiasan emosi.'
    },
    {
      icon: <Wallet className="w-6 h-6 text-blue-600" />,
      title: 'Pemisahan Kantong Uang',
      desc: 'Saldo terpisah rapi: Kas Umum, Dompet Belanja, Dana Darurat, Dana Pendidikan, hingga tabungan impian Umroh & Rumah.'
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-purple-600" />,
      title: 'Reality Check & Tutup Bulan',
      desc: 'Tutup bulan dengan 4 pertanyaan kejujuran finansial, rekap rencana vs aktual, rayakan Financial Win, dan rollover rapi ke bulan depan.'
    },
    {
      icon: <Lock className="w-6 h-6 text-stone-700" />,
      title: 'Local-First & Privasi Utuh',
      desc: 'Data tersimpan langsung di browser Anda via IndexedDB. Tanpa akun paksa, tanpa server pelacak, dan tanpa iklan.'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Setup Penghasilan & Alokasi',
      desc: 'Masukkan pemasukan bulanan dan bagi persentase keluarga lalu porsi personal dalam sekali duduk.'
    },
    {
      step: '02',
      title: 'Catat Transaksi Harian & Mood',
      desc: 'Catat pengeluaran, pemasukan, atau pindah kantong dalam 30 detik beserta emosi saat bertransaksi.'
    },
    {
      step: '03',
      title: 'Pantau Dashboard & Batas Harian',
      desc: 'Lihat progres anggaran, proyeksi akhir bulan, serta status kantong darurat agar tetap on track.'
    },
    {
      step: '04',
      title: 'Ritual Tutup Bulan & Refleksi',
      desc: 'Jawab Reality Check 4 pertanyaan, simpan laporan bulanan, dan bawa pelajaran berharga ke bulan baru.'
    }
  ];

  return (
    <div className="space-y-12 py-6">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 border border-rose-100 p-8 sm:p-12 shadow-sm">
        
        {/* Background decorative blob */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-rose-200/40 to-amber-200/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-rose-200 shadow-sm text-xs font-semibold text-rose-700">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Aplikasi Perencanaan Anggaran Generasi Sandwich di Indonesia</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-tight">
              Beri Nafkah Keluarga, Rawat Orang Tua,{' '}
              <span className="bg-gradient-to-r from-rose-600 via-amber-600 to-red-600 bg-clip-text text-transparent">
                Tanpa Mengorbankan Masa Depan Sendiri.
              </span>
            </h1>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl">
              Meowney hadir untuk Anda yang menanggung dua arah kewajiban sekaligus. Memisahkan kewajiban keluarga sebelum uang personal dipakai, mencatat konteks emosi di balik pengeluaran, dan menjaga dana darurat tetap bernapas.
            </p>

            {/* Gratuitous Statement per PRD FR-01 */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-4 h-4" /> Gratis Selamanya
              </span>
              <span className="text-xs text-stone-500">
                Tanpa paywall • Tanpa langganan • Tanpa iklan • Local-First
              </span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-rose-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{hasSetup ? 'Buka Dashboard Anda' : 'Mulai Setup Anggaran Anda'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lucky Cat Hero Graphic */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 opacity-60 blur-xl group-hover:opacity-80 transition duration-500" />
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-white p-4 shadow-xl border-4 border-white flex items-center justify-center">
                <img
                  src="/lucky-cat.png"
                  alt="Lucky Cat JS Logo"
                  className="w-full h-full object-contain animate-bounce-short"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full border border-stone-200 shadow-md text-xs font-bold text-stone-800 whitespace-nowrap flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Didukung oleh Lucky Cat JS</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 6 Feature Cards (FR-01) */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Didesain Khusus untuk Tantangan Nyata Anda
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            Bukan sekadar buku kas biasa, tapi sistem komprehensif dua lapis yang memahami beban ganda Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-stone-200 hover:border-rose-300 hover:shadow-md transition-all text-left space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-stone-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Cara Kerja (FR-01) */}
      <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 text-left">
        <div className="max-w-2xl mb-8">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
            Siklus 4 Langkah
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Cara Kerja Meowney Setiap Bulan
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Alur praktis yang dirancang agar kebiasaan mencatat bertahan lama tanpa rasa bersalah.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step, idx) => (
            <div key={idx} className="relative bg-stone-800/80 rounded-2xl p-6 border border-stone-700/60 flex flex-col justify-between">
              <div>
                <span className="text-3xl font-black text-rose-500/80 mb-2 block">{step.step}</span>
                <h4 className="text-sm font-bold text-stone-100 mb-1.5">{step.title}</h4>
                <p className="text-xs text-stone-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voluntary Support / Bantu Traktir per PRD */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Dukungan Sukarela — Bantu Traktir Kopi
            </h4>
            <p className="text-xs text-amber-800">
              Meowney 100% gratis tanpa batasan fitur. Bila Anda merasa terbantu, donasi sukarela dapat disalurkan melalui menu Panduan & Dukungan.
            </p>
          </div>
        </div>
        <button
          onClick={onStart}
          className="whitespace-nowrap px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
        >
          Mulai Sekarang →
        </button>
      </div>

    </div>
  );
};
