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
import { OnboardingModal } from './components/OnboardingModal';

// Mobile-First Components
import { MobileBottomNav, type MobileTab } from './components/mobile/MobileBottomNav';
import { MobileHome } from './components/mobile/MobileHome';
import { MobileQuickInputModal } from './components/mobile/MobileQuickInputModal';
import { MobilePockets } from './components/mobile/MobilePockets';
import { MobileRekap } from './components/mobile/MobileRekap';
import { MobileMenu } from './components/mobile/MobileMenu';

import { 
  Heart, 
  Bell, 
  X, 
  Smartphone, 
  Layout, 
  ChevronLeft, 
  ChevronRight,
  Flame,
  ArrowLeft,
  UserCheck
} from 'lucide-react';
import { formatMonthYear, formatIDR } from './utils/formatters';

export const App: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  
  // App Mode: 'mobile' (default simple) or 'full' (desktop/admin)
  const [appMode, setAppMode] = useState<'mobile' | 'full'>('mobile');
  
  // Desktop Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  
  // Mobile Tab & Subpages
  const [mobileTab, setMobileTab] = useState<MobileTab>('home');
  const [mobileSubpage, setMobileSubpage] = useState<string | null>(null);
  const [isQuickInputOpen, setIsQuickInputOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

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
    overBudgetThreshold: 80,
    hasCompletedOnboarding: false
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
      // Trigger onboarding on first visit if not yet completed
      if (!appSettings.hasCompletedOnboarding && !appSettings.profile) {
        setIsOnboardingOpen(true);
      }
    }

    if (txList.length >= 10 && !appSettings?.lastBackupDate) {
      setShowBackupReminder(true);
    }

    setIsLoaded(true);
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

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6] text-stone-600">
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
    <div className="min-h-screen bg-[#FBF9F6] text-stone-900 flex flex-col font-sans selection:bg-rose-100 selection:text-rose-900">
      
      {/* Interactive Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        initialProfile={settings.profile}
        onComplete={() => {
          setIsOnboardingOpen(false);
          loadData();
        }}
      />

      {/* Gate Modal if Locked (FR-24 & FR-28) */}
      {isLocked && (
        <GateModal
          onUnlock={() => setIsLocked(false)}
          correctPassword={settings.casualPassword}
          isEncrypted={settings.localEncryptionEnabled}
        />
      )}

      {/* Quick Input Modal for Mobile */}
      <MobileQuickInputModal
        isOpen={isQuickInputOpen}
        onClose={() => setIsQuickInputOpen(false)}
        pockets={pockets}
        currentMonth={selectedMonth}
        setup={setup}
        onSaved={loadData}
      />

      {/* Backup Reminder Banner */}
      {showBackupReminder && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Pengingat Cadangan:</strong> Ekspor cadangan JSON Anda secara berkala agar aman dari pembersihan browser.
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

      {/* =========================================================================
          MODE 1: MOBILE-FIRST SIMPEL (Default)
          ========================================================================= */}
      {appMode === 'mobile' ? (
        <div className="flex-1 flex flex-col max-w-md w-full mx-auto px-4 sm:px-0">
          
          {/* Mobile Top Header */}
          <header className="sticky top-0 z-30 bg-[#FBF9F6]/95 backdrop-blur-md pt-3 pb-2.5 flex items-center justify-between border-b border-stone-200/60 mb-3">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white p-1 shadow-sm border border-stone-200/80">
                <img src="/lucky-cat.png" alt="Lucky Cat JS" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-stone-900 tracking-tight leading-none">
                  Meowney
                </h1>
                <span className="text-[10px] text-emerald-600 font-bold">Money Planner</span>
              </div>
            </div>

            {/* Center: Month Selector */}
            <div className="flex items-center bg-white px-2 py-1 rounded-xl border border-stone-200/80 shadow-xs">
              <button onClick={handlePrevMonth} className="p-1 text-stone-500 hover:text-stone-900">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-xs font-bold text-stone-800">
                {formatMonthYear(selectedMonth)}
              </span>
              <button onClick={handleNextMonth} className="p-1 text-stone-500 hover:text-stone-900">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Switcher Button (To Full Mode) */}
            <button
              onClick={() => setAppMode('full')}
              title="Beralih ke Tampilan Lengkap Desktop"
              className="px-2.5 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Layout className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Lengkap</span>
            </button>
          </header>

          {/* Subpage Header (if user opened a specific page from Menu) */}
          {mobileSubpage && (
            <div className="mb-3 flex items-center justify-between bg-white px-3 py-2.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <button
                onClick={() => setMobileSubpage(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-rose-600 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Menu</span>
              </button>
              <span className="text-[11px] font-bold text-stone-500">
                {mobileSubpage === 'setup' && 'Setup Anggaran'}
                {mobileSubpage === 'debts' && 'Hutang & Piutang'}
                {mobileSubpage === 'assets' && 'Aset & Kekayaan'}
                {mobileSubpage === 'guide' && 'Panduan Keuangan'}
                {mobileSubpage === 'settings' && 'Pengaturan'}
              </span>
            </div>
          )}

          {/* Mobile Main Content */}
          <main className="flex-1">
            {mobileSubpage ? (
              /* Specific detailed screen opened inside mobile container */
              <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-sm mb-20 text-left overflow-hidden">
                {mobileSubpage === 'setup' && (
                  <SetupAwalSection
                    currentMonth={selectedMonth}
                    profile={settings.profile}
                    onSetupSaved={loadData}
                    onGoToDashboard={() => setMobileSubpage(null)}
                  />
                )}
                {mobileSubpage === 'debts' && (
                  <HutangPiutangSection
                    debts={debts}
                    pockets={pockets}
                    onDataChanged={loadData}
                  />
                )}
                {mobileSubpage === 'assets' && (
                  <AsetKekayaanSection
                    assets={assets}
                    pockets={pockets}
                    debts={debts}
                    setup={setup}
                    allTransactions={transactions}
                    onDataChanged={loadData}
                  />
                )}
                {mobileSubpage === 'guide' && (
                  <PanduanSection />
                )}
                {mobileSubpage === 'settings' && (
                  <PengaturanSection
                    settings={settings}
                    pockets={pockets}
                    onSettingsChanged={loadData}
                    onDataReset={loadData}
                  />
                )}
              </div>
            ) : (
              /* Standard 4 Mobile Tabs */
              <>
                {mobileTab === 'home' && (
                  <MobileHome
                    currentMonth={selectedMonth}
                    setup={setup}
                    transactions={transactions}
                    pockets={pockets}
                    profile={settings.profile}
                    onOpenQuickInput={() => setIsQuickInputOpen(true)}
                    onNavigateToTab={(t) => setMobileTab(t)}
                    onOpenOnboarding={() => setIsOnboardingOpen(true)}
                  />
                )}

                {mobileTab === 'pockets' && (
                  <MobilePockets
                    pockets={pockets}
                    transactions={transactions}
                    onDataChanged={loadData}
                    onOpenQuickTransfer={() => setIsQuickInputOpen(true)}
                  />
                )}

                {mobileTab === 'rekap' && (
                  <MobileRekap
                    currentMonth={selectedMonth}
                    setup={setup}
                    transactions={transactions}
                    pockets={pockets}
                    onMonthClosed={loadData}
                  />
                )}

                {mobileTab === 'menu' && (
                  <MobileMenu
                    onSwitchToFullDesktop={() => setAppMode('full')}
                    onNavigateSubpage={(p) => setMobileSubpage(p)}
                    onLockApp={() => setIsLocked(true)}
                    onOpenOnboarding={() => setIsOnboardingOpen(true)}
                    settings={settings}
                    onDataRefresh={loadData}
                  />
                )}
              </>
            )}
          </main>

          {/* Bottom Fixed Navigation Bar */}
          <MobileBottomNav
            currentTab={mobileTab}
            onTabChange={(tab) => {
              setMobileSubpage(null);
              setMobileTab(tab);
            }}
            onOpenQuickInput={() => setIsQuickInputOpen(true)}
          />

        </div>
      ) : (
        /* =========================================================================
           MODE 2: FULL DESKTOP (PRD 11 SECTIONS)
           ========================================================================= */
        <div className="flex-1 flex flex-col">
          
          {/* Full Desktop Header with Mobile Switcher Pill & Profile Badge */}
          <div className="bg-stone-900 text-stone-200 py-1.5 px-4 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>💻 Mode Lengkap Desktop Aktif</span>
              {settings.profile && (
                <button
                  onClick={() => setIsOnboardingOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-800 text-amber-300 hover:bg-stone-700 transition text-[11px]"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>
                    {settings.profile.name} ({settings.profile.maritalStatus === 'single' ? 'Single' : 'Menikah'} • {settings.profile.isSandwich ? 'Sandwich Gen' : 'Bebas Sandwich'})
                  </span>
                </button>
              )}
            </div>

            <button
              onClick={() => setAppMode('mobile')}
              className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Beralih ke Versi Simpel Mobile</span>
            </button>
          </div>

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
                profile={settings.profile}
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
      )}

    </div>
  );
};
