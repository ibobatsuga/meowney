import Dexie, { type Table } from 'dexie';
import type {
  BudgetSetup,
  Transaction,
  Pocket,
  DebtLoan,
  Asset,
  ReflectionData,
  AppSettings,
  AllocationItem
} from '../types';

export class MeowneyDatabase extends Dexie {
  setups!: Table<BudgetSetup, string>;
  transactions!: Table<Transaction, string>;
  pockets!: Table<Pocket, string>;
  debts!: Table<DebtLoan, string>;
  assets!: Table<Asset, string>;
  reflections!: Table<ReflectionData, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('MeowneyDatabase');
    this.version(1).stores({
      setups: 'month',
      transactions: 'id, date, month, mode, pocketId, categoryOrSource',
      pockets: 'id, name, type',
      debts: 'id, type, status, dueDate',
      assets: 'id, type',
      reflections: 'month',
      settings: 'id'
    });
  }
}

export const db = new MeowneyDatabase();

// Default Pockets according to FR-08
export const DEFAULT_POCKETS: Pocket[] = [
  { id: 'pkt-kas-umum', name: 'Kas Umum', type: 'general', color: 'emerald', isDefault: true },
  { id: 'pkt-dompet-belanja', name: 'Dompet Belanja', type: 'spending', color: 'amber', isDefault: true },
  { id: 'pkt-dana-darurat', name: 'Dana Darurat', type: 'emergency', color: 'rose', isDefault: true },
  { id: 'pkt-dana-pendidikan', name: 'Dana Pendidikan', type: 'education', color: 'blue', isDefault: true },
  { id: 'pkt-tabungan-umroh', name: 'Tabungan Umroh', type: 'goal', color: 'teal', targetAmount: 35000000, isDefault: true },
  { id: 'pkt-tabungan-liburan', name: 'Tabungan Liburan', type: 'goal', color: 'cyan', targetAmount: 7500000, isDefault: true },
  { id: 'pkt-tabungan-gadget', name: 'Tabungan Gadget', type: 'goal', color: 'violet', targetAmount: 12000000, isDefault: true },
  { id: 'pkt-tabungan-rumah', name: 'Tabungan Rumah', type: 'goal', color: 'indigo', targetAmount: 150000000, isDefault: true },
];

// Default Family Allocations according to FR-02
export const DEFAULT_FAMILY_ALLOCATION_DEFAULTS: Omit<AllocationItem, 'amount' | 'id'>[] = [
  { name: 'Beras & Sembako', percentage: 30 },
  { name: 'Listrik & Air', percentage: 15 },
  { name: 'Pendidikan & Les', percentage: 20 },
  { name: 'Transportasi & Bensin', percentage: 15 },
  { name: 'Cicilan & Hutang Keluarga', percentage: 10 },
  { name: 'Orang Tua / Mertua', percentage: 5 },
  { name: 'Dana Darurat & Tabungan', percentage: 5 },
];

// Default Personal Allocations according to FR-02
export const DEFAULT_PERSONAL_ALLOCATION_DEFAULTS: Omit<AllocationItem, 'amount' | 'id'>[] = [
  { name: 'Kebutuhan Pribadi', percentage: 40 },
  { name: 'Healing & Santai', percentage: 15 },
  { name: 'Tabungan Mandiri', percentage: 10 },
  { name: 'Investasi', percentage: 10 },
  { name: 'Dana Darurat Pribadi', percentage: 10 },
  { name: 'Cicilan Pribadi', percentage: 5 },
  { name: 'Self Reward', percentage: 10 },
];

// Default Expense Categories for Input Harian (FR-06)
export const EXPENSE_CATEGORIES = [
  'Makan',
  'Transportasi',
  'Belanja Bulanan',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Tagihan',
  'Cicilan',
  'Orang Tua',
  'Lainnya'
];

export const INCOME_SOURCES = [
  'Gaji & Bonus',
  'Bisnis',
  'Investasi & Aset',
  'Lainnya'
];

export const MOODS: { type: import('../types').MoodType; emoji: string; label: string; bg: string; text: string }[] = [
  { type: 'Senang', emoji: '😸', label: 'Senang', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
  { type: 'Biasa', emoji: '😺', label: 'Biasa', bg: 'bg-stone-50 text-stone-700 border-stone-200', text: 'text-stone-700' },
  { type: 'Galau', emoji: '🙀', label: 'Galau', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' },
  { type: 'Cemas', emoji: '😿', label: 'Cemas', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'text-yellow-700' },
  { type: 'Stres', emoji: '😾', label: 'Stres', bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700' },
  { type: 'Suntuk', emoji: '🥱', label: 'Suntuk', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700' },
  { type: 'Sedih', emoji: '😢', label: 'Sedih', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' },
  { type: 'Marah', emoji: '🗯️', label: 'Marah', bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700' },
];

// Database initialization helper
export async function initializeDatabase() {
  const pocketsCount = await db.pockets.count();
  if (pocketsCount === 0) {
    await db.pockets.bulkAdd(DEFAULT_POCKETS);
  }

  const settings = await db.settings.get('current');
  if (!settings) {
    await db.settings.put({
      id: 'current',
      casualGateEnabled: false,
      localEncryptionEnabled: false,
      overBudgetThreshold: 80,
    });
  }
}
