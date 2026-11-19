import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  HeartHandshake, 
  Smile, 
  Target, 
  BookHeart, 
  Save, 
  Sparkles,
  Calendar
} from 'lucide-react';
import type { ReflectionData } from '../types';
import { db } from '../db';
import { formatMonthYear } from '../utils/formatters';

interface RefleksiSectionProps {
  currentMonth: string;
}

export const RefleksiSection: React.FC<RefleksiSectionProps> = ({ currentMonth }) => {
  const [happyMoment, setHappyMoment] = useState('');
  const [nextMonthTarget, setNextMonthTarget] = useState('');
  const [freeNotes, setFreeNotes] = useState('');
  const [q1, setQ1] = useState(''); // Apa beban emosional terberat terkait finansial bulan ini?
  const [q2, setQ2] = useState(''); // Apa kompromi yang berhasil dicapai bersama keluarga/pasangan?
  const [q3, setQ3] = useState(''); // Kapan kamu merasa bersyukur atau berdaya atas uangmu?
  const [q4, setQ4] = useState(''); // Apa satu hal yang ingin kamu katakan pada dirimu sendiri?
  const [savedData, setSavedData] = useState<ReflectionData | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    const data = await db.reflections.get(currentMonth);
    if (data) {
      setSavedData(data);
      setHappyMoment(data.happyMoment || '');
      setNextMonthTarget(data.nextMonthTarget || '');
      setFreeNotes(data.freeNotes || '');
      // Reality check or extra questions if any
    } else {
      setSavedData(null);
      setHappyMoment('');
      setNextMonthTarget('');
      setFreeNotes('');
    }
  };

  const handleSave = async () => {
    const data: ReflectionData = {
      month: currentMonth,
      financialWin: savedData?.financialWin || '',
      realityCheck: savedData?.realityCheck || { q1: '', q2: '', q3: '', q4: '' },
      happyMoment,
      nextMonthTarget,
      freeNotes,
      isClosed: savedData?.isClosed || false,
      closedAt: savedData?.closedAt
    };

    await db.reflections.put(data);
    setSavedData(data);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              Refleksi Bulanan Terpandu
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              {formatMonthYear(currentMonth)}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Uang bukan sekadar angka di neraca. Ruang tenang bagi Anda untuk bernapas dan mengapresiasi perjuangan hidup.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'Tersimpan!' : 'Simpan Refleksi'}</span>
        </button>
      </div>

      {/* Guided Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Momen Bahagia */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Momen Bahagia Bulan Ini
              </h3>
              <p className="text-xs text-stone-500">
                Hal sederhana yang membuat hati Anda hangat bersama keluarga atau diri sendiri.
              </p>
            </div>
          </div>
          <textarea
            rows={4}
            value={happyMoment}
            onChange={(e) => setHappyMoment(e.target.value)}
            placeholder="Contoh: Mengajak anak makan es krim di akhir pekan, atau mendengar ibu tersenyum saat paket beras bulanan tiba di kampung..."
            className="w-full p-4 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm bg-stone-50/50 text-stone-900"
          />
        </div>

        {/* Target Bulan Depan */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Fokus & Niat Bulan Depan
              </h3>
              <p className="text-xs text-stone-500">
                Satu atau dua resolusi realistis untuk menjaga ritme keuangan tetap sehat.
              </p>
            </div>
          </div>
          <textarea
            rows={4}
            value={nextMonthTarget}
            onChange={(e) => setNextMonthTarget(e.target.value)}
            placeholder="Contoh: Menahan diri dari langganan aplikasi yang tidak terpakai, dan menambah tabungan umroh Rp500.000 lebih awal..."
            className="w-full p-4 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm bg-stone-50/50 text-stone-900"
          />
        </div>

      </div>

      {/* Catatan Bebas & Jurnal */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BookHeart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Catatan Bebas & Pesan untuk Diri Sendiri
            </h3>
            <p className="text-xs text-stone-500">
              Tuliskan apa pun yang mengganjal atau kata penyemangat untuk perjalanan Anda sebagai pilar keluarga.
            </p>
          </div>
        </div>

        <textarea
          rows={6}
          value={freeNotes}
          onChange={(e) => setFreeNotes(e.target.value)}
          placeholder="Tuliskan isi hati Anda di sini tanpa khawatir dihakimi. Anda sudah berjuang keras menjadi jembatan bagi dua generasi..."
          className="w-full p-4 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm bg-stone-50/50 text-stone-900 leading-relaxed"
        />

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Tersimpan Rapi' : 'Simpan Refleksi'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};
