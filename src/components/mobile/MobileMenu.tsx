import React from 'react';
import { 
  BadgePercent, 
  ShieldAlert, 
  PiggyBank, 
  BookOpen, 
  Settings2, 
  Download, 
  Upload, 
  Lock, 
  Coffee, 
  Layout, 
  ChevronRight,
  Heart
} from 'lucide-react';
import type { AppSettings } from '../../types';
import { exportAllDataJSON, downloadFile, importDataJSON } from '../../utils/exportImport';
import { getTodayDateStr } from '../../utils/formatters';

interface MobileMenuProps {
  onSwitchToFullDesktop: () => void;
  onNavigateSubpage: (page: string) => void;
  onLockApp?: () => void;
  settings: AppSettings;
  onDataRefresh: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  onSwitchToFullDesktop,
  onNavigateSubpage,
  onLockApp,
  settings,
  onDataRefresh,
}) => {
  const handleExport = async () => {
    try {
      const json = await exportAllDataJSON();
      downloadFile(json, `Meowney-Backup-${getTodayDateStr()}.json`, 'application/json');
      alert('Data cadangan JSON berhasil diunduh ke perangkat Anda!');
    } catch (e: any) {
      alert('Gagal ekspor: ' + e.message);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Impor akan menimpa data di browser. Lanjutkan?')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importDataJSON(content);
      alert(res.message);
      if (res.success) onDataRefresh();
    };
    reader.readAsText(file);
  };

  const menuItems = [
    {
      icon: <BadgePercent className="w-5 h-5 text-rose-600" />,
      title: 'Setup Alokasi Dua Lapis',
      desc: 'Atur gaji, porsi keluarga vs personal',
      action: () => onNavigateSubpage('setup')
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
      title: 'Hutang & Piutang',
      desc: 'Pantau jatuh tempo kewajiban & tagihan',
      action: () => onNavigateSubpage('debts')
    },
    {
      icon: <PiggyBank className="w-5 h-5 text-purple-600" />,
      title: 'Aset & Kekayaan Bersih',
      desc: 'Investasi, emas, properti & dana darurat',
      action: () => onNavigateSubpage('assets')
    },
    {
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      title: 'Panduan Lengkap (13 Bab)',
      desc: 'Strategi finansial generasi sandwich & FAQ',
      action: () => onNavigateSubpage('guide')
    },
    {
      icon: <Settings2 className="w-5 h-5 text-stone-700" />,
      title: 'Pusat Pengaturan Lengkap',
      desc: 'Enkripsi AES-256, CSV import, Gist backup',
      action: () => onNavigateSubpage('settings')
    }
  ];

  return (
    <div className="space-y-4 pb-20 text-left max-w-md mx-auto">
      
      {/* App Branding & Mode Switcher Card */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/lucky-cat.png" alt="Lucky Cat JS" className="w-12 h-12 object-contain" />
          <div>
            <h3 className="text-sm font-black text-stone-900">Meowney Mobile</h3>
            <p className="text-[11px] text-stone-400">Versi Ringkas & Simpel</p>
          </div>
        </div>

        <button
          onClick={onSwitchToFullDesktop}
          className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center gap-1.5"
        >
          <Layout className="w-3.5 h-3.5 text-stone-600" />
          <span>Mode Lengkap</span>
        </button>
      </div>

      {/* Menu List */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm divide-y divide-stone-100 overflow-hidden">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">{item.title}</h4>
                <p className="text-[10px] text-stone-500">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-300" />
          </button>
        ))}
      </div>

      {/* Quick Backup & Gate Card */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-sm space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
          Kedaulatan & Keamanan Data
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExport}
            className="py-2.5 px-3 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-stone-50 transition">
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Impor JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>

        {settings.casualGateEnabled && onLockApp && (
          <button
            onClick={onLockApp}
            className="w-full py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Kunci Aplikasi Sekarang</span>
          </button>
        )}
      </div>

      {/* Traktir Kopi Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Coffee className="w-6 h-6 text-amber-600" />
          <div>
            <p className="text-xs font-bold text-amber-950">Bantu Traktir Kopi Meowney</p>
            <p className="text-[10px] text-amber-800">100% sukarela untuk pengembang</p>
          </div>
        </div>
        <a
          href="https://saweria.co/meowney"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-sm"
        >
          Traktir
        </a>
      </div>

    </div>
  );
};
