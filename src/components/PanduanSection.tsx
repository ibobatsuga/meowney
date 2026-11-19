import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Coffee, 
  ChevronRight, 
  Heart, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Smile,
  Wallet
} from 'lucide-react';

export const PanduanSection: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState(0);

  const chapters = [
    {
      num: '01',
      title: 'Mengenal Realitas Generasi Sandwich',
      summary: 'Mengapa beban dua arah membutuhkan sistem yang berbeda dari budgeting konvensional.',
      content: `Generasi sandwich adalah mereka yang berada di posisi unik sekaligus menantang: dari satu sumber penghasilan bulanan, Anda harus membiayai kebutuhan keluarga inti (pasangan & anak) sekaligus membantu orang tua atau adik di kampung.
      
Budgeting biasa (seperti aturan baku 50/30/20) kerap gagal karena memperlakukan semua pengeluaran setara. Akibatnya, uang untuk orang tua atau sembako anak sering merebut pos tabungan atau dana darurat Anda sendiri.`
    },
    {
      num: '02',
      title: 'Filosofi Alokasi Dua Lapis Meowney',
      summary: 'Keluarga dulu, lalu porsi personal. Menghapus rasa bersalah belanja.',
      content: `Kunci ketenangan generasi sandwich adalah kepastian. Meowney membagi alokasi dalam dua lapis terpisah:
      
1. Lapis Pertama (Kewajiban Keluarga): Beras & sembako, listrik, SPP/les anak, transportasi, hutang keluarga, dan kiriman orang tua. Pos ini dipenuhi dulu sejak awal bulan.
2. Lapis Kedua (Hak Personal & Masa Depan): Setelah kewajiban keluarga aman, sisa porsi personal Anda bagi untuk kebutuhan mandiri, tabungan darurat pribadi, investasi, self-reward, dan healing.

Dengan sistem ini, saat Anda ngopi atau self-reward, Anda melakukannya dengan tenang tanpa rasa bersalah, karena kewajiban keluarga sudah lunas terjaga.`
    },
    {
      num: '03',
      title: 'Menghitung Batas Harian Aman (Safe Daily Spend)',
      summary: 'Bagaimana rumus pembagian sisa alokasi dengan sisa hari melindungi akhir bulan Anda.',
      content: `Kebocoran finansial terbesar sering kali bukan transaksi jutaan rupiah sekaligus, melainkan "latte factor" atau jajan kecil harian Rp30.000 - Rp50.000 yang tak terkontrol.
      
Meowney secara otomatis menghitung Safe Daily Spend: sisa anggaran belanja dibagi dengan sisa hari dalam bulan berjalan. Jika batas harian Anda Rp120.000/hari dan hari ini Anda hanya belanja Rp80.000, Anda berada di zona AMAN. Sebaliknya bila Anda belanja Rp250.000, sistem akan memberi alert bahwa tempo belanja perlu dikoreksi.`
    },
    {
      num: '04',
      title: 'Konteks Emosi di Balik Setiap Transaksi',
      summary: 'Mengapa kita sering checkout barang saat lelah atau stres.',
      content: `Bagi generasi sandwich, tekanan mental sering bertransformasi menjadi impulsive spending. Saat lelah lembur atau suntuk menghadapi tuntutan keluarga, jari kita otomatis membuka aplikasi belanja.
      
Di Meowney, setiap pengeluaran dapat ditandai dengan 8 mood (Senang, Biasa, Galau, Cemas, Stres, Suntuk, Sedih, Marah). Di akhir bulan, Anda bisa melihat apakah 40% pengeluaran Anda ternyata terjadi saat "Stres" atau "Suntuk". Kesadaran emosional adalah langkah awal penghematan yang langgeng.`
    },
    {
      num: '05',
      title: 'Menjaga Dana Darurat Tetap Bernapas',
      summary: 'Strategi 3 lapis darurat: 1x, 3x, dan 6x gaji bulanan.',
      content: `Bagi generasi sandwich, dana darurat adalah perisai pelindung utama. Jika motor orang tua rusak atau anak mendadak demam, tanpa dana darurat Anda akan terpaksa meminjam uang (berhutang).
      
Bangun dana darurat bertahap:
- Milestone 1: 1x Gaji (Mencegah hutang jangka pendek)
- Milestone 2: 3x Gaji (Zona aman keluarga)
- Milestone 3: 6x Gaji (Kemandirian penuh dari krisis).`
    },
    {
      num: '06',
      title: 'Komunikasi Terbuka dengan Orang Tua & Pasangan',
      summary: 'Menentukan batas kiriman tanpa melukai perasaan orang yang dicintai.',
      content: `Berbakti pada orang tua bukan berarti menyerahkan seluruh masa depan tanpa batas. Tentukan nominal tetap yang realistis untuk kiriman orang tua setiap bulan, dan komunikasikan dengan penuh kasih.
      
Jika ada kebutuhan mendadak dari orang tua, diskusikan secara transparan bersama pasangan agar rumah tangga tetap harmonis.`
    },
    {
      num: '07',
      title: 'Pemisahan Kantong Uang (Envelope Method Modern)',
      summary: 'Mengapa rekening atau kantong tujuan harus dipisah secara disiplin.',
      content: `Ketika semua uang berkumpul di satu rekening kas, otak kita tertipu melihat saldo yang besar. Akibatnya uang SPP anak terpakai untuk traktir makan malam.
      
Meowney menyediakan kantong digital: Kas Umum, Dompet Belanja, Dana Darurat, Dana Pendidikan, serta kantong impian (Umroh, Liburan, Gadget, Rumah). Pisahkan saldo sesuai fungsinya.`
    },
    {
      num: '08',
      title: 'Etika & Batasan Hutang-Piutang',
      summary: 'Mengapa mencatat tanggal jatuh tempo adalah bentuk kasih sayang.',
      content: `Banyak hubungan persaudaraan renggang akibat hutang yang tidak tercatat jelas atau tanggal pengembalian yang mengambang.
      
Catat selalu siapa yang meminjam, nominal, dan tanggal jatuh tempo. Jangan ragu menolak memberikan pinjaman bila pos darurat keluarga Anda sendiri belum tercukupi.`
    },
    {
      num: '09',
      title: 'Ritual Tutup Bulan: Menghadapi Kenyataan Tanpa Takut',
      summary: 'Kenapa tutup bulan bukan untuk menghakimi, melainkan belajar.',
      content: `Banyak orang takut melihat pengeluaran akhir bulan karena cemas mendapati diri boros. Meowney mengubahnya menjadi ritual yang memberdayakan.
      
Bandingkan rencana vs aktual. Bila ada pos yang "Perlu adjust", itu bukan kegagalan, melainkan data untuk menyesuaikan alokasi bulan berikutnya agar lebih realistis.`
    },
    {
      num: '10',
      title: '4 Pertanyaan Reality Check',
      summary: 'Mengukur kejujuran finansial sebelum melangkah ke bulan baru.',
      content: `Di Meowney, setiap akhir bulan Anda diajak menjawab 4 pertanyaan:
1. Apakah ada belanja impulsif yang sebenarnya bisa dihindari?
2. Apakah kiriman keluarga lancar tanpa mengorbankan pos darurat?
3. Bagaimana kondisi dana darurat bulan ini?
4. Apakah Anda sudah cukup menghargai diri sendiri?`
    },
    {
      num: '11',
      title: 'Self-Reward yang Proporsional',
      summary: 'Pentingnya mengapresiasi diri sendiri agar tidak burnout.',
      content: `Menjadi pilar keluarga adalah maraton puluhan tahun, bukan sprint. Jika Anda terus menekan kebutuhan diri hingga tidak pernah menikmati jerih payah sendiri, Anda akan mengalami burnout emosional.
      
Alokasikan 5% - 10% untuk self-reward dan healing secara sadar dan terjadwal.`
    },
    {
      num: '12',
      title: 'Kekayaan Bersih vs Saldo Rekening',
      summary: 'Memahami gambaran kekayaan riil Anda.',
      content: `Saldo di rekening hanyalah sebagian kecil dari cerita keuangan Anda. Kekayaan bersih (Net Worth) sejati dihitung dari: Seluruh Kas + Aset (Emas, Investasi, Kendaraan, Properti) dikurangi Seluruh Hutang Aktif.
      
Melihat angka net worth yang bertumbuh tiap bulan memberikan motivasi jangka panjang yang jauh lebih kuat.`
    },
    {
      num: '13',
      title: 'Privasi & Kedaulatan Data Finansial Lokal',
      summary: 'Mengapa Meowney memilih arsitektur local-first tanpa server pusat.',
      content: `Data keuangan adalah salah satu privasi paling mendasar dalam hidup manusia. Meowney menyimpan data Anda di IndexedDB browser perangkat Anda sendiri.
      
Tidak ada pihak ketiga atau server aplikasi yang mengintip gaji atau pengeluaran Anda. Anda memegang kendali penuh melalui ekspor JSON berkala dan backup terenkripsi.`
    }
  ];

  const faqs = [
    {
      q: 'Apakah data keuangan saya aman dan tidak bocor ke orang lain?',
      a: 'Sangat aman. Meowney berjalan local-first di browser Anda. Tidak ada data transaksi atau saldo yang dikirim ke server pusat atau analitik pihak ketiga.'
    },
    {
      q: 'Bagaimana jika saya ganti HP atau ganti browser laptop?',
      a: 'Buka menu Pengaturan, lalu klik "Ekspor Cadangan JSON". Simpan berkas tersebut, lalu di perangkat baru buka Meowney dan klik "Impor Cadangan JSON". Data Anda akan pulih 100% seketika.'
    },
    {
      q: 'Apakah Meowney benar-benar gratis selamanya?',
      a: 'Ya, 100% gratis selamanya. Tidak ada paywall, fitur terkunci, iklan, atau uji coba berbayar. Proyek ini dibangun dengan komitmen tulus membantu keluarga generasi sandwich di Indonesia.'
    },
    {
      q: 'Bagaimana cara berkontribusi atau mendukung Meowney?',
      a: 'Anda dapat mendukung pengembangan Meowney secara sukarela melalui donasi "Bantu Traktir Kopi" di bawah, atau dengan membagikan Meowney kepada rekan dan kerabat yang sama-sama berjuang sebagai generasi sandwich.'
    }
  ];

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="border-b border-stone-200 pb-4">
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          Panduan Lengkap & FAQ Meowney
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          13 bab panduan praktis pengelolaan keuangan generasi sandwich beserta jawaban atas pertanyaan umum.
        </p>
      </div>

      {/* Chapters Navigation & Content View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Chapters Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-1.5 max-h-[600px] overflow-y-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 py-1 block">
            Daftar Bab Panduan (13 Bab)
          </span>

          {chapters.map((ch, idx) => (
            <button
              key={ch.num}
              onClick={() => setActiveChapter(idx)}
              className={`w-full text-left p-3 rounded-2xl transition flex items-start gap-2.5 ${
                activeChapter === idx
                  ? 'bg-rose-50 text-rose-900 font-bold border border-rose-200'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              <span className={`text-xs font-black ${activeChapter === idx ? 'text-rose-600' : 'text-stone-400'}`}>
                {ch.num}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{ch.title}</p>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">{ch.summary}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Chapter Reader Card (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <span className="text-xs font-black text-rose-600 uppercase tracking-widest">
              Bab {chapters[activeChapter].num}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
              {chapters[activeChapter].title}
            </h3>
            <p className="text-xs text-stone-500 mt-1 italic">
              {chapters[activeChapter].summary}
            </p>
          </div>

          <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line space-y-4 font-normal">
            {chapters[activeChapter].content}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-stone-100">
            <button
              disabled={activeChapter === 0}
              onClick={() => setActiveChapter(c => c - 1)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 disabled:opacity-30"
            >
              ← Bab Sebelumnya
            </button>
            <button
              disabled={activeChapter === chapters.length - 1}
              onClick={() => setActiveChapter(c => c + 1)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-30"
            >
              Bab Selanjutnya →
            </button>
          </div>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-bold text-stone-900">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
              <h4 className="text-xs font-bold text-stone-900">{f.q}</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bantu Traktir Sukarela (FR-17 AC) */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 rounded-3xl p-6 sm:p-8 border border-amber-300 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 text-white flex items-center justify-center shadow-lg shrink-0">
            <Coffee className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-amber-950">
                Bantu Traktir Kopi Meowney
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Sukarela
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-1 max-w-xl leading-relaxed">
              Meowney dibuat sepenuh hati tanpa biaya langganan, tanpa iklan, dan tanpa batasan data. Jika aplikasi ini membantu Anda mengatur nafkah keluarga, Anda dapat mengirimkan traktiran kopi sukarela untuk mendukung kelanjutan pengembangannya.
            </p>
          </div>
        </div>

        <div className="text-center md:text-right shrink-0">
          <div className="inline-block bg-white p-3 rounded-2xl border border-amber-200 shadow-sm text-xs text-amber-950 font-bold">
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">Saweria / Traktir / QRIS</p>
            <p className="text-sm font-extrabold text-amber-600 mt-0.5">saweria.co/meowney</p>
          </div>
        </div>
      </div>

    </div>
  );
};
