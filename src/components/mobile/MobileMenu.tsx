import React from 'react';
import { 
  BadgePercent, 
  ShieldAlert, 
  PiggyBank, 
  BookOpen, 
  Settings2, 
  Lock, 
  Coffee, 
  Layout, 
  ChevronRight,
  UserCheck,
  Heart
} from 'lucide-react';
import type { AppSettings } from '../../types';

interface MobileMenuProps {
  onSwitchToFullDesktop: () => void;
  onNavigateSubpage: (page: string) => void;
  onLockApp?: () => void;
  onOpenOnboarding: () => void;
  settings: AppSettings;
  onDataRefresh: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  onSwitchToFullDesktop,
  onNavigateSubpage,
  onLockApp,
  onOpenOnboarding,
  settings,
}) => {
  const profile = settings.profile;

  const menuItems = [
    {
      icon: <UserCheck className="w-5 h-5 text-rose-600" />,
      title: 'Profil & Persona Finansial',
      desc: profile 
        ? `${profile.maritalStatus === 'single' ? 'Single' : 'Menikah'} • ${profile.isSandwich ? 'Sandwich Gen' : 'Bebas Sandwich'}`
        : 'Atur status pernikahan & generasi sandwich',
      action: onOpenOnboarding
    },
    {
      icon: <BadgePercent className="w-5 h-5 text-amber-600" />,
      title: 'Setup Alokasi Dua Lapis',
      desc: 'Atur penghasilan & persentase pos belanja',
      action: () => onNavigateSubpage('setup')
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      title: 'Hutang & Piutang',
      desc: 'Pantau jatuh tempo kewajiban & pinjaman',
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

      {/* Casual Gate Lock Button if Enabled */}
      {settings.casualGateEnabled && onLockApp && (
        <button
          onClick={onLockApp}
          className="w-full py-3 rounded-2xl bg-white border border-stone-200/80 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
        >
          <Lock className="w-3.5 h-3.5 text-stone-500" />
          <span>Kunci Aplikasi Sekarang</span>
        </button>
      )}

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
