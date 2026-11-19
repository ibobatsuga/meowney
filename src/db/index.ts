import Dexie, { type Table } from 'dexie';
import type {
  BudgetSetup,
  Transaction,
  Pocket,
  DebtLoan,
  Asset,
  ReflectionData,
  AppSettings,
  AllocationItem,
  MaritalStatus
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

// Profile Tailored Allocation Generator
export function getProfileBasedAllocations(
  maritalStatus: MaritalStatus = 'married_with_kids',
  isSandwich: boolean = true
) {
  if (isSandwich) {
    if (maritalStatus === 'single') {
      // 1. Single Sandwich (Menanggung ortu/adik dari gaji sendiri)
      return {
        familySplit: 45,
        personalSplit: 55,
        layer1Label: 'Kiriman Keluarga & Orang Tua',
        layer2Label: 'Kebutuhan Mandiri & Masa Depan',
        familyItems: [
          { name: 'Kiriman Orang Tua / Mertua', percentage: 40 },
          { name: 'Sembako & Rumah Orang Tua', percentage: 25 },
          { name: 'Bantuan Pendidikan Adik', percentage: 20 },
          { name: 'Dana Darurat Keluarga', percentage: 15 },
        ],
        personalItems: [
          { name: 'Kost & Kebutuhan Pribadi', percentage: 35 },
          { name: 'Tabungan Mandiri', percentage: 20 },
          { name: 'Investasi Masa Depan', percentage: 15 },
          { name: 'Dana Darurat Pribadi', percentage: 15 },
          { name: 'Self Reward & Healing', percentage: 15 },
        ]
      };
    } else {
      // 2. Married Sandwich (Anak, Pasangan, Orang Tua/Mertua)
      return {
        familySplit: 70,
        personalSplit: 30,
        layer1Label: 'Kewajiban Dapur, Anak & Orang Tua',
        layer2Label: 'Personal, Healing & Self-Reward',
        familyItems: [
          { name: 'Beras & Sembako Dapur', percentage: 30 },
          { name: 'Listrik, Air & Internet', percentage: 15 },
          { name: 'Pendidikan & Les Anak', percentage: 20 },
          { name: 'Transportasi & Bensin', percentage: 15 },
          { name: 'Cicilan & Hutang Keluarga', percentage: 10 },
          { name: 'Kiriman Orang Tua / Mertua', percentage: 5 },
          { name: 'Dana Darurat Keluarga', percentage: 5 },
        ],
        personalItems: [
          { name: 'Kebutuhan Pribadi', percentage: 40 },
          { name: 'Healing & Santai', percentage: 15 },
          { name: 'Tabungan Mandiri', percentage: 10 },
          { name: 'Investasi', percentage: 10 },
          { name: 'Dana Darurat Pribadi', percentage: 10 },
          { name: 'Cicilan Pribadi', percentage: 5 },
          { name: 'Self Reward', percentage: 10 },
        ]
      };
    }
  } else {
    // 3. Non-Sandwich (Tidak menanggung kiriman wajib orang tua)
    if (maritalStatus === 'single') {
      // Single Bebas Sandwich (Fokus mandiri & aset)
      return {
        familySplit: 25,
        personalSplit: 75,
        layer1Label: 'Tempat Tinggal & Komitmen Pokok',
        layer2Label: 'Masa Depan, Investasi & Gaya Hidup',
        familyItems: [
          { name: 'Sewa Kost / Tempat Tinggal', percentage: 40 },
          { name: 'Listrik, Air & Utilitas', percentage: 25 },
          { name: 'Bakti Sukarela Ortu & Sedekah', percentage: 20 },
          { name: 'Dana Darurat Mandiri', percentage: 15 },
        ],
        personalItems: [
          { name: 'Makan & Belanja Pokok', percentage: 35 },
          { name: 'Tabungan Rumah / Impian', percentage: 25 },
          { name: 'Investasi & Saham/Reksadana', percentage: 20 },
          { name: 'Hobi, Healing & Self-Reward', percentage: 20 },
        ]
      };
    } else {
      // Married Bebas Sandwich (Fokus keluarga inti)
      return {
        familySplit: 60,
        personalSplit: 40,
        layer1Label: 'Kebutuhan Rumah Tangga & Anak',
        layer2Label: 'Tabungan Bersama & Personal',
        familyItems: [
          { name: 'Kebutuhan Dapur & Belanja Rumah', percentage: 35 },
          { name: 'Tagihan Rumah, Listrik & Air', percentage: 20 },
          { name: 'Pendidikan & Kebutuhan Anak', percentage: 25 },
          { name: 'Dana Darurat Keluarga Inti', percentage: 20 },
        ],
        personalItems: [
          { name: 'Tabungan & Investasi Bersama', percentage: 35 },
          { name: 'Kebutuhan Pribadi Pasangan', percentage: 30 },
          { name: 'Liburan & Quality Time Bersama', percentage: 20 },
          { name: 'Self Reward Suami/Istri', percentage: 15 },
        ]
      };
    }
  }
}

// Fallback defaults
export const DEFAULT_FAMILY_ALLOCATION_DEFAULTS = getProfileBasedAllocations('married_with_kids', true).familyItems;
export const DEFAULT_PERSONAL_ALLOCATION_DEFAULTS = getProfileBasedAllocations('married_with_kids', true).personalItems;

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
      hasCompletedOnboarding: false,
    });
  }
}
