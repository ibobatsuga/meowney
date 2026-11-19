export type TransactionMode = 'expense' | 'income' | 'transfer' | 'asset_sale';

export type MoodType = 'Senang' | 'Sedih' | 'Stres' | 'Biasa' | 'Galau' | 'Marah' | 'Suntuk' | 'Cemas';

export interface AllocationItem {
  id: string;
  name: string;
  percentage: number; // e.g. 30
  amount: number;     // integer IDR
}

export interface BudgetSetup {
  month: string; // YYYY-MM
  income: number; // total income in integer IDR
  familyPercentage: number; // percentage allocated to family (e.g. 70%)
  personalPercentage: number; // percentage allocated to personal (e.g. 30%)
  familyAllocation: AllocationItem[];
  personalAllocation: AllocationItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  mode: TransactionMode;
  categoryOrSource: string;
  amount: number; // integer IDR
  pocketId: string; // source pocket
  destinationPocketId?: string; // for transfer
  assetId?: string; // for asset_sale
  mood?: MoodType;
  note?: string;
  isRecurring?: boolean;
  recurringDay?: number;
  importSource?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pocket {
  id: string;
  name: string;
  type: 'general' | 'spending' | 'emergency' | 'education' | 'goal' | 'custom';
  targetAmount?: number;
  targetDate?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface DebtLoan {
  id: string;
  type: 'debt' | 'loan'; // 'debt' = kita berhutang (kewajiban), 'loan' = kita meminjamkan (piutang)
  personName: string;
  amount: number; // integer IDR
  pocketId: string;
  dueDate: string; // YYYY-MM-DD
  status: 'unpaid' | 'paid';
  paidDate?: string;
  note?: string;
  createdAt: string;
}

export type AssetType = 'Tabungan' | 'Properti' | 'Kendaraan' | 'Emas' | 'Investasi' | 'Barang';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number; // integer IDR
  note?: string;
  updatedAt: string;
}

export interface RealityCheckAnswers {
  q1: string; // "Apakah ada pengeluaran impulsif atau emosional yang bisa dihindari?"
  q2: string; // "Apakah kiriman untuk keluarga/orang tua lancar dan sesuai porsi tanpa mengorbankan pos darurat?"
  q3: string; // "Bagaimana kondisi dana darurat bulan ini? Apakah aman atau terpaksa terpakai?"
  q4: string; // "Apakah kamu merasa cukup menghargai dirimu (self-reward/healing) secara proporsional?"
}

export interface ReflectionData {
  month: string;
  financialWin: string;
  realityCheck: RealityCheckAnswers;
  happyMoment: string;
  nextMonthTarget: string;
  freeNotes: string;
  isClosed: boolean;
  closedAt?: string;
}

export interface AppSettings {
  id: string; // 'current'
  casualGateEnabled: boolean;
  casualPassword?: string;
  localEncryptionEnabled: boolean;
  gistToken?: string;
  gistId?: string;
  lastBackupDate?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  syncEnabled?: boolean;
  overBudgetThreshold: number; // default 80 (%)
}
