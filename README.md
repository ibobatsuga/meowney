# 🐱 Meowney (with Lucky Cat JS)

**Meowney** adalah aplikasi perencanaan anggaran (*budget planning*) modern yang dirancang khusus untuk **Generasi Sandwich** di Indonesia, dengan dukungan arsitektur **Local-First** dan antarmuka **Mobile-First**.

Didukung oleh maskot **Lucky Cat JS** (Maneki-neko kucing pembawa keberuntungan).

---

## ✨ Fitur Unggulan

1. **Alokasi Dua Lapis (Two-Layer Budgeting)**:
   - **Lapis 1 (Keluarga & Tanggungan)**: Beras & sembako, listrik & air, SPP anak, kiriman orang tua / mertua, dan dana darurat keluarga.
   - **Lapis 2 (Personal & Masa Depan)**: Kebutuhan mandiri, tabungan pribadi, investasi, self-reward, dan healing.
2. **Onboarding & Personalisasi Profil**:
   - Pilihan status kehidupan: *Single (Belum Menikah)*, *Menikah*, atau *Menikah & Memiliki Anak*.
   - Penentu status: *Generasi Sandwich* (menanggung orang tua) vs *Bukan Generasi Sandwich* (fokus keluarga inti/mandiri).
   - Penyesuaian persentase dan pos alokasi otomatis berdasarkan profil.
3. **Batas Belanja Harian Aman (Safe Daily Spend)**:
   - Kalkulasi sisa anggaran belanja dibagi sisa hari dengan status: 🟢 Aman, 🟡 Waspada, atau 🔴 Lewat.
4. **Konteks Emosi pada Uang (8 Moods)**:
   - Setiap pengeluaran dapat ditandai dengan emosi: *Senang, Sedih, Stres, Biasa, Galau, Marah, Suntuk, Cemas* untuk melihat pola belanja impulsif.
5. **Pemisahan Kantong Uang (Envelope Method Modern)**:
   - Saldo terpisah per tujuan: *Kas Umum, Dompet Belanja, Dana Darurat, Dana Pendidikan, Tabungan Umroh, Liburan, Gadget, Rumah*.
6. **Ritual Tutup Bulan & Reality Check**:
   - Evaluasi rencana vs realisasi, pencatatan *Financial Win*, 4 pertanyaan kejujuran finansial, dan *rollover* otomatis.
7. **Laporan Resmi PDF & Arus Kas**:
   - Cetak laporan PDF `Laporan-[Bulan]-[Tahun].pdf` dengan kop Meowney & Lucky Cat, plus unduh data CSV.
8. **Kedaulatan Data & Local-First (IndexedDB)**:
   - Berjalan 100% di browser pengguna tanpa pelacak pihak ketiga.
   - Ekspor & Impor cadangan JSON (skema Zod).
   - Opsi enkripsi lokal AES-GCM-256 dan backup ke GitHub Gist privat.
9. **Dua Mode Tampilan**:
   - **Mode Simpel (Mobile-First)**: Navigasi bawah (*Bottom Nav*), tombol bulat melayang *(+) Catat Cepat* 10 detik, dan tampilan ramah jempol.
   - **Mode Lengkap (Desktop/Admin)**: Analitik 11 section komprehensif, grafik tahunan 12 bulan, dan pencatatan hutang/aset lengkap.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Plus Jakarta Sans
- **Storage**: IndexedDB via Dexie.js (Offline-First)
- **Icons**: Lucide React
- **Dokumen & Cetak**: jsPDF + jsPDF-AutoTable
- **Validasi**: Zod + PapaParse
- **Hosting**: Vercel

---

## 🚀 Menjalankan Secara Lokal

```bash
# Clone repository
git clone https://github.com/ibobatsuga/meowney.git
cd meowney

# Install dependencies
npm install

# Jalankan server development
npm run dev
```

Buka [http://localhost:5173/](http://localhost:5173/) di browser Anda.

---

## 📄 Lisensi

100% Gratis & Terbuka untuk seluruh pejuang generasi sandwich di Indonesia. Dibuat dengan ❤️ dan didukung oleh maskot **Lucky Cat JS**.
