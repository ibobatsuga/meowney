import React, { useState, useEffect } from 'react';
import { 
  db, 
  initializeDatabase 
} from './db';
import type { 
  BudgetSetup, 
  Transaction, 
  Pocket, 
  DebtLoan, 
  Asset, 
  ReflectionData, 
  AppSettings 
} from './types';
import { getCurrentMonthStr } from './utils/formatters';
import { calculatePocketBalances, calculateSafeDailySpend } from './utils/calculator';
import { Navbar, type NavTab } from './components/Navbar';
import { GateModal } from './components/GateModal';
import { WelcomeSection } from './components/WelcomeSection';
import { SetupAwalSection } from './components/SetupAwalSection';
import { InputHarianSection } from './components/InputHarianSection';
import { DashboardSection } from './components/DashboardSection';
import { KantongUangSection } from './components/KantongUangSection';
import { RekapRealityCheckSection } from './components/RekapRealityCheckSection';
import { LaporanSection } from './components/LaporanSection';
import { TahunanSection } from './components/TahunanSection';
import { RefleksiSection } from './components/RefleksiSection';
import { HutangPiutangSection } from './components/HutangPiutangSection';
import { AsetKekayaanSection } from './components/AsetKekayaanSection';
import { PanduanSection } from './components/PanduanSection';
import { PengaturanSection } from './components/PengaturanSection';
import { Heart, Bell, Shield, X } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [currentTab, setCurrentTab] = useState<NavTab>('welcome');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Database Data States
  const [setup, setSetup] = useState<BudgetSetup | undefined>(undefined);
  const [allSetups, setAllSetups] = useState<BudgetSetup[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [debts, setDebts] = useState<DebtLoan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'current',
    casualGateEnabled: false,
    localEncryptionEnabled: false,
    overBudgetThreshold: 80
  });

  // Backup Reminder Banner (FR-19)
  const [showBackupReminder, setShowBackupReminder] = useState<boolean>(false);

  // Load all data from Dexie
  const loadData = async () => {
    await initializeDatabase();

    const curSetup = await db.setups.get(selectedMonth);
    setSetup(curSetup);

    const sList = await db.setups.toArray();
    setAllSetups(sList);

    const txList = await db.transactions.toArray();
    setTransactions(txList);

    const pktList = await db.pockets.toArray();
    setPockets(pktList);

    const debtList = await db.debts.toArray();
    setDebts(debtList);

    const assetList = await db.assets.toArray();
    setAssets(assetList);

    const appSettings = await db.settings.get('current');
    if (appSettings) {
      setSettings(appSettings);
      if (appSettings.casualGateEnabled && appSettings.casualPassword) {
        setIsLocked(true);
      }
    }

    // Check backup reminder (FR-19: if transactions > 10 and no backup recently)
    if (txList.length >= 10 && !appSettings?.lastBackupDate) {
      setShowBackupReminder(true);
    }

    // Default tab routing (FR-01: if has setup, start at dashboard)
    if (!isLoaded) {
      if (curSetup || sList.length > 0) {
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('welcome');
      }
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  // Derived real-time calculations
  const pocketBalances = calculatePocketBalances(pockets, transactions);
  let totalLiquid = 0;
  for (const p of pocketBalances.values()) {
    totalLiquid += p.balance;
  }

  // Safe daily spend for header
  const monthTxs = transactions.filter(t => t.month === selectedMonth || t.date.startsWith(selectedMonth));
  const monthExpense = monthTxs.filter(t => t.mode === 'expense').reduce((a, b) => a + b.amount, 0);
  const safeDaily = calculateSafeDailySpend(setup, monthExpense);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-600">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 mx-auto flex items-center justify-center animate-bounce">
            <img src="/lucky-cat.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Memuat Meowney...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-stone-900 flex flex-col font-sans">
      
      {/* Gate Modal if Locked (FR-24 & FR-28) */}
      {isLocked && (
        <GateModal
          onUnlock={() => setIsLocked(false)}
          correctPassword={settings.casualPassword}
          isEncrypted={settings.localEncryptionEnabled}
        />
      )}

      {/* Top Navigation Bar with Lucky Cat JS Logo */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        selectedMonth={selectedMonth}
        onMonthChange={(month) => setSelectedMonth(month)}
        safeDailySpend={safeDaily.safeDailyAmount}
        totalLiquidBalance={totalLiquid}
        hasSetup={!!setup}
        onLockApp={() => setIsLocked(true)}
        isGateEnabled={settings.casualGateEnabled}
      />

      {/* Backup Reminder Banner (FR-19) */}
      {showBackupReminder && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Pengingat Cadangan:</strong> Anda sudah mencatat banyak transaksi! Jangan lupa ekspor cadangan data JSON Anda di menu Pengaturan agar tidak hilang bila browser dibersihkan.
            </span>
          </div>
          <button
            onClick={() => setShowBackupReminder(false)}
            className="p-1 hover:bg-amber-200 rounded-lg text-amber-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'welcome' && (
          <WelcomeSection
            hasSetup={allSetups.length > 0}
            onStart={() => setCurrentTab(allSetups.length > 0 ? 'dashboard' : 'setup')}
          />
        )}

        {currentTab === 'setup' && (
          <SetupAwalSection
            currentMonth={selectedMonth}
            onSetupSaved={loadData}
            onGoToDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'input' && (
          <InputHarianSection
            currentMonth={selectedMonth}
            pockets={pockets}
            transactions={transactions}
            setup={setup}
            assets={assets}
            onTransactionsChanged={loadData}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardSection
            currentMonth={selectedMonth}
            setup={setup}
            transactions={transactions}
            pockets={pockets}
            assets={assets}
            debts={debts}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'pockets' && (
          <KantongUangSection
            pockets={pockets}
            transactions={transactions}
            onDataChanged={loadData}
            onNavigateToInput={() => setCurrentTab('input')}
          />
        )}

        {currentTab === 'rekap' && (
          <RekapRealityCheckSection
            currentMonth={selectedMonth}
            setup={setup}
            transactions={transactions}
            onMonthClosed={loadData}
            onNavigateToNextMonth={(nextM) => {
              setSelectedMonth(nextM);
              setCurrentTab('dashboard');
            }}
          />
        )}

        {currentTab === 'reports' && (
          <LaporanSection
            currentMonth={selectedMonth}
            setup={setup}
            transactions={transactions}
            pockets={pockets}
          />
        )}

        {currentTab === 'annual' && (
          <TahunanSection
            transactions={transactions}
            selectedYear={parseInt(selectedMonth.split('-')[0], 10)}
          />
        )}

        {currentTab === 'reflection' && (
          <RefleksiSection
            currentMonth={selectedMonth}
          />
        )}

        {currentTab === 'debts' && (
          <HutangPiutangSection
            debts={debts}
            pockets={pockets}
            onDataChanged={loadData}
          />
        )}

        {currentTab === 'assets' && (
          <AsetKekayaanSection
            assets={assets}
            pockets={pockets}
            debts={debts}
            setup={setup}
            allTransactions={transactions}
            onDataChanged={loadData}
          />
        )}

        {currentTab === 'guide' && (
          <PanduanSection />
        )}

        {currentTab === 'settings' && (
          <PengaturanSection
            settings={settings}
            pockets={pockets}
            onSettingsChanged={loadData}
            onDataReset={loadData}
          />
        )}
      </main>

      {/* Warm Footer */}
      <footer className="border-t border-stone-200 bg-white/60 py-6 text-center text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/lucky-cat.png" alt="Lucky Cat JS" className="w-6 h-6 object-contain" />
            <span className="font-extrabold text-stone-800">Meowney</span>
            <span>— Perencanaan Anggaran Generasi Sandwich di Indonesia</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>100% Local-First (IndexedDB)</span>
            <span>•</span>
            <span>Rupiah (IDR) Saja</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-rose-600 font-semibold">
              Dibuat dengan <Heart className="w-3.5 h-3.5 fill-rose-600" /> untuk Pejuang Keluarga
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};
