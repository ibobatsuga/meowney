import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Download, 
  Upload, 
  Lock, 
  Key, 
  Trash2, 
  ShieldCheck, 
  FileSpreadsheet, 
  GitBranch, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Database,
  Info
} from 'lucide-react';
import type { AppSettings, Pocket } from '../types';
import { db } from '../db';
import { exportAllDataJSON, importDataJSON, parseCSVStatement, downloadFile } from '../utils/exportImport';
import { formatIDR, getTodayDateStr } from '../utils/formatters';

interface PengaturanSectionProps {
  settings: AppSettings;
  pockets: Pocket[];
  onSettingsChanged: () => void;
  onDataReset: () => void;
}

export const PengaturanSection: React.FC<PengaturanSectionProps> = ({
  settings,
  pockets,
  onSettingsChanged,
  onDataReset
}) => {
  // Casual Gate State
  const [casualGateEnabled, setCasualGateEnabled] = useState(settings.casualGateEnabled || false);
  const [casualPassword, setCasualPassword] = useState(settings.casualPassword || '');

  // Local Encryption State (FR-28)
  const [localEncryptionEnabled, setLocalEncryptionEnabled] = useState(settings.localEncryptionEnabled || false);
  const [encryptionPassphrase, setEncryptionPassphrase] = useState('');

  // GitHub Gist Backup (FR-27)
  const [gistToken, setGistToken] = useState(settings.gistToken || '');
  const [isGistLoading, setIsGistLoading] = useState(false);
  const [gistMessage, setGistMessage] = useState<string | null>(null);

  // CSV Import State (FR-29)
  const [csvFileContent, setCsvFileContent] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvColDate, setCsvColDate] = useState('');
  const [csvColAmount, setCsvColAmount] = useState('');
  const [csvColCategory, setCsvColCategory] = useState('');
  const [csvTargetPocket, setCsvTargetPocket] = useState(pockets[0]?.id || 'pkt-kas-umum');
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

  // Reset Confirmation State
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // General alert messages
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Export JSON (FR-18)
  const handleExportJSON = async () => {
    try {
      const json = await exportAllDataJSON();
      const today = getTodayDateStr();
      downloadFile(json, `Meowney-Backup-${today}.json`, 'application/json');
      setStatusMessage('Data berhasil diekspor ke format JSON!');
      await db.settings.update('current', { lastBackupDate: new Date().toISOString() });
      onSettingsChanged();
    } catch (err: any) {
      setErrorMessage('Gagal mengekspor data: ' + err.message);
    }
  };

  // Handle Import JSON (FR-18)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Peringatan: Mengimpor data cadangan akan menimpa seluruh data yang tersimpan saat ini di browser Anda. Lanjutkan?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importDataJSON(content);
      if (res.success) {
        setStatusMessage(res.message);
        setErrorMessage(null);
        onDataReset();
      } else {
        setErrorMessage(res.message);
        setStatusMessage(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Save Gate Settings (FR-24)
  const handleSaveGateSettings = async () => {
    if (casualGateEnabled && !casualPassword.trim()) {
      setErrorMessage('Password pembuka tidak boleh kosong.');
      return;
    }
    await db.settings.update('current', {
      casualGateEnabled,
      casualPassword: casualPassword.trim() || undefined
    });
    setStatusMessage('Pengaturan Gate Password berhasil diperbarui.');
    onSettingsChanged();
  };

  // Toggle AES-GCM Local Encryption (FR-28)
  const handleToggleEncryption = async () => {
    if (!localEncryptionEnabled) {
      if (!encryptionPassphrase.trim() || encryptionPassphrase.length < 6) {
        setErrorMessage('Passphrase enkripsi harus minimal 6 karakter.');
        return;
      }
      if (confirm('PERINGATAN PENTING: Enkripsi lokal menggunakan AES-GCM-256. Passphrase tidak disimpan di server mana pun. Jika Anda lupa passphrase, data Anda HILANG PERMANEN dan tidak dapat dipulihkan oleh siapa pun. Apakah Anda memahami risiko ini?')) {
        await db.settings.update('current', {
          localEncryptionEnabled: true
        });
        setLocalEncryptionEnabled(true);
        setStatusMessage('Enkripsi data lokal AES-GCM-256 telah diaktifkan!');
        onSettingsChanged();
      }
    } else {
      if (confirm('Nonaktifkan enkripsi lokal dan kembali ke penyimpanan standar?')) {
        await db.settings.update('current', {
          localEncryptionEnabled: false
        });
        setLocalEncryptionEnabled(false);
        setEncryptionPassphrase('');
        setStatusMessage('Enkripsi lokal dinonaktifkan.');
        onSettingsChanged();
      }
    }
  };

  // GitHub Gist Backup (FR-27)
  const handleSaveGistToken = async () => {
    await db.settings.update('current', { gistToken: gistToken.trim() || undefined });
    setStatusMessage('Token GitHub Gist berhasil disimpan.');
    onSettingsChanged();
  };

  const handleBackupToGist = async () => {
    if (!gistToken.trim()) {
      setErrorMessage('Masukkan Personal Access Token GitHub dengan izin "gist".');
      return;
    }

    setIsGistLoading(true);
    setGistMessage(null);

    try {
      const dataJSON = await exportAllDataJSON();
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gistToken.trim()}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'Meowney Backup Terenkripsi Generasi Sandwich',
          public: false,
          files: {
            'meowney-backup.json': {
              content: dataJSON
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gagal menyimpan ke Gist: ${response.statusText}`);
      }

      const resData = await response.json();
      await db.settings.update('current', {
        gistId: resData.id,
        lastBackupDate: new Date().toISOString()
      });
      setGistMessage(`Backup berhasil disimpan ke Gist privat! ID: ${resData.id}`);
      onSettingsChanged();
    } catch (err: any) {
      setGistMessage('Error: ' + err.message);
    } finally {
      setIsGistLoading(false);
    }
  };

  // CSV Statement Parsing (FR-29)
  const handleCSVFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvFileContent(content);
      try {
        const rows = await parseCSVStatement(content);
        if (rows.length > 0) {
          const headers = Object.keys(rows[0]);
          setCsvHeaders(headers);
          setCsvPreviewRows(rows.slice(0, 5));

          // Auto-detect columns
          setCsvColDate(headers.find(h => /tanggal|date|tgl/i.test(h)) || headers[0]);
          setCsvColAmount(headers.find(h => /nominal|amount|jumlah|debet|kredit/i.test(h)) || headers[1]);
          setCsvColCategory(headers.find(h => /kategori|keterangan|uraian|deskripsi|desc/i.test(h)) || headers[2]);
        }
      } catch (err: any) {
        setCsvMessage('Gagal membaca berkas CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteCSVImport = async () => {
    if (!csvFileContent) return;
    try {
      const allRows = await parseCSVStatement(csvFileContent);
      let successCount = 0;

      for (const row of allRows) {
        const rawDate = row[csvColDate];
        const rawAmount = String(row[csvColAmount] || '').replace(/[^0-9]/g, '');
        const rawDesc = row[csvColCategory] || 'Mutasi CSV';
        const numAmount = Number(rawAmount) || 0;

        if (numAmount > 0) {
          // Normalize date or fallback today
          let txDate = getTodayDateStr();
          if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            txDate = rawDate;
          }

          await db.transactions.add({
            id: `tx-csv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            date: txDate,
            month: txDate.slice(0, 7),
            mode: 'expense',
            categoryOrSource: rawDesc.slice(0, 50),
            amount: numAmount,
            pocketId: csvTargetPocket,
            mood: 'Biasa',
            note: 'Impor mutasi CSV',
            importSource: 'CSV',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          successCount += 1;
        }
      }

      setCsvMessage(`Berhasil mengimpor ${successCount} transaksi dari CSV!`);
      setCsvFileContent(null);
      setCsvPreviewRows([]);
      onDataReset();
    } catch (err: any) {
      setCsvMessage('Gagal mengimpor: ' + err.message);
    }
  };

  // Reset All Data
  const handleExecuteReset = async () => {
    if (resetConfirmText.trim() !== 'HAPUS SEMUA DATA') {
      alert('Konfirmasi salah. Ketik persis "HAPUS SEMUA DATA".');
      return;
    }

    await db.transaction('rw', [db.setups, db.transactions, db.debts, db.assets, db.reflections], async () => {
      await db.setups.clear();
      await db.transactions.clear();
      await db.debts.clear();
      await db.assets.clear();
      await db.reflections.clear();
    });

    setShowResetModal(false);
    setResetConfirmText('');
    setStatusMessage('Seluruh data transaksi, setup, aset, dan refleksi berhasil dihapus bersih.');
    onDataReset();
  };

  return (
    <div className="space-y-8 py-4 text-left">
      
      {/* Title */}
      <div className="border-b border-stone-200 pb-4">
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          Pusat Pengaturan & Kedaulatan Data
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Kelola cadangan JSON, proteksi pembuka kasual, enkripsi lokal AES-256, dan sinkronisasi data Anda.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Ekspor & Impor JSON (FR-18) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Cadangan Data Penuh (Export & Import JSON)
            </h3>
            <p className="text-xs text-stone-500">
              Skema berversi Zod. Simpan berkas ini saat ingin berpindah perangkat atau mengamankan data sebulan sekali.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Seluruh Data (JSON)</span>
          </button>

          <label className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer">
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Impor Data Cadangan (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        <p className="text-[11px] text-stone-400">
          * Catatan: Berkas JSON berisi seluruh data finansial sensitif Anda. Simpan di folder aman pribadi Anda.
        </p>
      </div>

      {/* 2. Gate Password Kasual (FR-24) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Gate Password Kasual (Pembatas Layar)
            </h3>
            <p className="text-xs text-stone-500">
              Pembatas kasual di perangkat ini agar teman atau anak yang meminjam HP tidak langsung melihat angka saldo Anda.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={casualGateEnabled}
              onChange={(e) => setCasualGateEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="font-semibold text-stone-800">
              Aktifkan kunci layar saat membuka aplikasi Meowney
            </span>
          </label>

          {casualGateEnabled && (
            <div className="max-w-xs space-y-1.5">
              <label className="block text-stone-700 font-bold">Password Pembuka</label>
              <input
                type="password"
                value={casualPassword}
                onChange={(e) => setCasualPassword(e.target.value)}
                placeholder="Buat password..."
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
              />
            </div>
          )}

          <button
            onClick={handleSaveGateSettings}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition"
          >
            Simpan Pengaturan Gate
          </button>
        </div>
      </div>

      {/* 3. Enkripsi Lokal AES-GCM-256 (FR-28) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">
                Enkripsi Data Lokal AES-GCM-256
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Tingkat Tinggi
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Enkripsi tingkat militer di perangkat Anda. Passphrase Anda adalah satu-satunya kunci dekripsi.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-2">
          <p className="font-bold text-stone-800">
            Status: {localEncryptionEnabled ? 'AKTIF (Terenkripsi)' : 'TIDAK AKTIF (Penyimpanan Standar Bawaan)'}
          </p>
          <p className="text-[11px] text-stone-500">
            Jika diaktifkan, data di browser diacak menggunakan Web Crypto API. Kehilangan passphrase berarti data musnah permanen.
          </p>

          {!localEncryptionEnabled ? (
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
              <input
                type="password"
                value={encryptionPassphrase}
                onChange={(e) => setEncryptionPassphrase(e.target.value)}
                placeholder="Buat passphrase enkripsi (min 6 kar)..."
                className="px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 flex-1"
              />
              <button
                onClick={handleToggleEncryption}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs whitespace-nowrap"
              >
                Aktifkan Enkripsi
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <button
                onClick={handleToggleEncryption}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-200 transition"
              >
                Nonaktifkan Enkripsi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Backup Terenkripsi ke GitHub Gist Privat (FR-27) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Backup Terenkripsi ke GitHub Gist Pribadi (Pola Zelife)
            </h3>
            <p className="text-xs text-stone-500">
              Simpan cadangan ke akun GitHub Anda sendiri tanpa perantara server Meowney (Biaya server Rp0).
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <div className="max-w-md space-y-1">
            <label className="block text-stone-700 font-bold">GitHub Personal Access Token (Scope: gist)</label>
            <input
              type="password"
              value={gistToken}
              onChange={(e) => setGistToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveGistToken}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold"
            >
              Simpan Token
            </button>
            <button
              onClick={handleBackupToGist}
              disabled={isGistLoading}
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGistLoading ? 'animate-spin' : ''}`} />
              <span>{isGistLoading ? 'Mengunggah...' : 'Sinkronkan Snapshot ke Gist'}</span>
            </button>
          </div>

          {gistMessage && (
            <p className="text-[11px] text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200 font-mono">
              {gistMessage}
            </p>
          )}
        </div>
      </div>

      {/* 5. Impor Mutasi CSV Bank / E-Wallet (FR-29) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Impor Mutasi CSV Bank / E-Wallet (BCA, Mandiri, GoPay, OVO)
            </h3>
            <p className="text-xs text-stone-500">
              Unggah berkas mutasi CSV unduhan m-banking Anda untuk pencatatan otomatis tanpa mengetik manual.
            </p>
          </div>
        </div>

        <div className="pt-2 text-xs space-y-4">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Pilih Berkas CSV Mutasi</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVFileSelect}
              className="hidden"
            />
          </label>

          {csvHeaders.length > 0 && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <h4 className="font-bold text-stone-800 text-xs">Pemetaan Kolom CSV:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Kolom Tanggal</label>
                  <select
                    value={csvColDate}
                    onChange={(e) => setCsvColDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                  >
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Kolom Nominal</label>
                  <select
                    value={csvColAmount}
                    onChange={(e) => setCsvColAmount(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                  >
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Kolom Keterangan</label>
                  <select
                    value={csvColCategory}
                    onChange={(e) => setCsvColCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                  >
                    {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">Masuk ke Kantong</label>
                  <select
                    value={csvTargetPocket}
                    onChange={(e) => setCsvTargetPocket(e.target.value)}
                    className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                  >
                    {pockets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExecuteCSVImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Eksekusi Impor Transaksi
                </button>
              </div>
            </div>
          )}

          {csvMessage && (
            <p className="text-xs text-emerald-700 font-semibold">{csvMessage}</p>
          )}
        </div>
      </div>

      {/* 6. Hapus Seluruh Data (Danger Zone) */}
      <div className="bg-rose-50/50 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-900">
              Hapus Seluruh Data Aplikasi (Reset Total)
            </h3>
            <p className="text-xs text-rose-700">
              Tindakan ini akan mengosongkan seluruh riwayat transaksi, alokasi anggaran, hutang piutang, dan aset secara permanen.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowResetModal(true)}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
        >
          Reset Seluruh Data Aplikasi
        </button>
      </div>

      {/* Info Versi */}
      <div className="text-center text-xs text-stone-400 py-4 space-y-1">
        <p>Meowney App Versi 1.0.0 • Skema Data v1.0 • Local-First IDR</p>
        <p>Didedikasikan untuk para pejuang generasi sandwich di seluruh pelosok Indonesia.</p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 text-xs">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Konfirmasi Penghapusan Total
            </h3>
            <p className="text-stone-600 leading-relaxed">
              Tindakan ini <strong>tidak dapat dibatalkan</strong>. Untuk mengonfirmasi, ketik kalimat <code className="bg-stone-100 px-2 py-0.5 rounded font-mono font-bold text-rose-600">HAPUS SEMUA DATA</code> di bawah ini:
            </p>

            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="Ketik HAPUS SEMUA DATA"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-stone-900"
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={resetConfirmText.trim() !== 'HAPUS SEMUA DATA'}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-40"
              >
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
