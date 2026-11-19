import React from 'react';
import { Home, Wallet, Plus, BarChart3, Menu } from 'lucide-react';

export type MobileTab = 'home' | 'pockets' | 'rekap' | 'menu';

interface MobileBottomNavProps {
  currentTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenQuickInput: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onTabChange,
  onOpenQuickInput,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-4 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        
        {/* Beranda */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'home' ? 'text-rose-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'home' ? 'bg-rose-50' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* Kantong */}
        <button
          onClick={() => onTabChange('pockets')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'pockets' ? 'text-rose-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'pockets' ? 'bg-rose-50' : ''}`}>
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Kantong</span>
        </button>

        {/* Big Floating Action Button for Quick Record */}
        <div className="relative -top-5">
          <button
            onClick={onOpenQuickInput}
            title="Catat Transaksi Cepat"
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/35 hover:scale-105 active:scale-95 transition-all p-3.5 border-4 border-[#FBF9F6]"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Rekap */}
        <button
          onClick={() => onTabChange('rekap')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'rekap' ? 'text-rose-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'rekap' ? 'bg-rose-50' : ''}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Rekap</span>
        </button>

        {/* Menu / Lainnya */}
        <button
          onClick={() => onTabChange('menu')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'menu' ? 'text-rose-600 font-bold' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <div className={`p-1 rounded-xl transition ${currentTab === 'menu' ? 'bg-rose-50' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Lainnya</span>
        </button>

      </div>
    </nav>
  );
};
