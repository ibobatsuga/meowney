import type { Transaction, BudgetSetup, Pocket, Asset, DebtLoan } from '../types';

export interface PocketBalanceSummary {
  pocketId: string;
  pocketName: string;
  type: string;
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  totalAssetSaleIn: number;
  balance: number;
  targetAmount?: number;
  targetDate?: string;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number; // income - expense
  totalTransfers: number;
  expenseByCategory: Record<string, number>;
  expenseByMood: Record<string, { count: number; total: number }>;
  transactionCount: number;
}

export interface CategoryComparison {
  category: string;
  planned: number;
  actual: number;
  diff: number; // planned - actual
  percentUsed: number;
  status: 'Sesuai rencana' | 'Perlu adjust';
  isOverWarning: boolean; // >= 80%
  isOverBudget: boolean;  // > 100%
}

// Calculate individual pocket balance strictly from transaction history
export function calculatePocketBalances(
  pockets: Pocket[],
  allTransactions: Transaction[]
): Map<string, PocketBalanceSummary> {
  const map = new Map<string, PocketBalanceSummary>();

  for (const p of pockets) {
    map.set(p.id, {
      pocketId: p.id,
      pocketName: p.name,
      type: p.type,
      totalIncome: 0,
      totalExpense: 0,
      totalTransferIn: 0,
      totalTransferOut: 0,
      totalAssetSaleIn: 0,
      balance: 0,
      targetAmount: p.targetAmount,
      targetDate: p.targetDate,
    });
  }

  for (const tx of allTransactions) {
    const amount = Math.round(Number(tx.amount) || 0);
    if (amount <= 0) continue;

    if (tx.mode === 'income') {
      const p = map.get(tx.pocketId);
      if (p) {
        p.totalIncome += amount;
      }
    } else if (tx.mode === 'expense') {
      const p = map.get(tx.pocketId);
      if (p) {
        p.totalExpense += amount;
      }
    } else if (tx.mode === 'transfer') {
      const src = map.get(tx.pocketId);
      const dst = tx.destinationPocketId ? map.get(tx.destinationPocketId) : null;
      if (src) src.totalTransferOut += amount;
      if (dst) dst.totalTransferIn += amount;
    } else if (tx.mode === 'asset_sale') {
      const dst = map.get(tx.pocketId);
      if (dst) dst.totalAssetSaleIn += amount;
    }
  }

  // Calculate net balance for each
  for (const summary of map.values()) {
    summary.balance =
      summary.totalIncome -
      summary.totalExpense -
      summary.totalTransferOut +
      summary.totalTransferIn +
      summary.totalAssetSaleIn;
  }

  return map;
}

// Calculate overall total liquid balance across all pockets
export function calculateTotalLiquidBalance(pocketBalances: Map<string, PocketBalanceSummary>): number {
  let total = 0;
  for (const p of pocketBalances.values()) {
    total += p.balance;
  }
  return total;
}

// Monthly summary (all transactions matching a month YYYY-MM)
export function calculateMonthlySummary(transactions: Transaction[], month: string): MonthSummary {
  const monthTxs = transactions.filter(t => t.month === month || t.date.startsWith(month));

  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfers = 0;
  const expenseByCategory: Record<string, number> = {};
  const expenseByMood: Record<string, { count: number; total: number }> = {};

  for (const tx of monthTxs) {
    const amt = Math.round(Number(tx.amount) || 0);
    if (amt <= 0) continue;

    if (tx.mode === 'income') {
      totalIncome += amt;
    } else if (tx.mode === 'expense') {
      totalExpense += amt;
      const cat = tx.categoryOrSource || 'Lainnya';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;

      if (tx.mood) {
        if (!expenseByMood[tx.mood]) {
          expenseByMood[tx.mood] = { count: 0, total: 0 };
        }
        expenseByMood[tx.mood].count += 1;
        expenseByMood[tx.mood].total += amt;
      }
    } else if (tx.mode === 'transfer') {
      totalTransfers += amt;
    }
  }

  return {
    totalIncome,
    totalExpense,
    netCashflow: totalIncome - totalExpense,
    totalTransfers,
    expenseByCategory,
    expenseByMood,
    transactionCount: monthTxs.length,
  };
}

// Compare plan vs actual per category (FR-11)
// Single strict status rule:
// If actual <= planned -> "Sesuai rencana"
// If actual > planned -> "Perlu adjust" (even if planned is 0, if actual > 0 it must be "Perlu adjust")
export function calculatePlanVsActual(
  setup: BudgetSetup | undefined,
  expenseByCategory: Record<string, number>,
  thresholdPercent = 80
): CategoryComparison[] {
  const categoriesMap = new Map<string, { planned: number; actual: number }>();

  if (setup) {
    for (const item of setup.familyAllocation) {
      categoriesMap.set(item.name, {
        planned: Math.round(Number(item.amount) || 0),
        actual: 0
      });
    }
    for (const item of setup.personalAllocation) {
      const existing = categoriesMap.get(item.name);
      if (existing) {
        existing.planned += Math.round(Number(item.amount) || 0);
      } else {
        categoriesMap.set(item.name, {
          planned: Math.round(Number(item.amount) || 0),
          actual: 0
        });
      }
    }
  }

  // Add actual expenses
  for (const [cat, actual] of Object.entries(expenseByCategory)) {
    const entry = categoriesMap.get(cat);
    if (entry) {
      entry.actual = actual;
    } else {
      categoriesMap.set(cat, { planned: 0, actual });
    }
  }

  const results: CategoryComparison[] = [];
  for (const [category, { planned, actual }] of categoriesMap.entries()) {
    const diff = planned - actual;
    const percentUsed = planned > 0 ? Math.round((actual / planned) * 100) : (actual > 0 ? 999 : 0);
    
    // FR-11: Rencana Rp0 dengan aktual > Rp0 selalu "Perlu adjust"
    const status: 'Sesuai rencana' | 'Perlu adjust' = actual > planned ? 'Perlu adjust' : 'Sesuai rencana';

    results.push({
      category,
      planned,
      actual,
      diff,
      percentUsed,
      status,
      isOverWarning: percentUsed >= thresholdPercent && percentUsed <= 100,
      isOverBudget: actual > planned,
    });
  }

  // Sort: biggest actual spend first
  return results.sort((a, b) => b.actual - a.actual);
}

// Safe daily spend calculation (FR-25)
export function calculateSafeDailySpend(
  setup: BudgetSetup | undefined,
  totalExpenseThisMonth: number,
  targetDate = new Date()
) {
  const currentDay = targetDate.getDate();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = Math.max(1, totalDaysInMonth - currentDay + 1);

  const totalPlannedBudget = setup
    ? setup.familyAllocation.reduce((acc, c) => acc + c.amount, 0) +
      setup.personalAllocation.reduce((acc, c) => acc + c.amount, 0)
    : 0;

  const remainingBudget = Math.max(0, totalPlannedBudget - totalExpenseThisMonth);
  const safeDailyAmount = Math.round(remainingBudget / remainingDays);

  const percentUsed = totalPlannedBudget > 0 ? (totalExpenseThisMonth / totalPlannedBudget) * 100 : 0;
  
  let status: 'aman' | 'mendekati' | 'melewati' = 'aman';
  if (totalExpenseThisMonth > totalPlannedBudget && totalPlannedBudget > 0) {
    status = 'melewati';
  } else if (percentUsed >= 80) {
    status = 'mendekati';
  }

  // Month-end projection
  const avgDailySpend = currentDay > 0 ? totalExpenseThisMonth / currentDay : 0;
  const projectedMonthEnd = Math.round(avgDailySpend * totalDaysInMonth);

  return {
    totalPlannedBudget,
    totalExpenseThisMonth,
    remainingBudget,
    remainingDays,
    safeDailyAmount,
    projectedMonthEnd,
    status,
    percentUsed: Math.round(percentUsed),
  };
}

// Net Worth = Total Assets - Total Active Debts (FR-05 & FR-16)
export function calculateNetWorth(assets: Asset[], debts: DebtLoan[], liquidBalance: number) {
  let totalOtherAssets = 0;
  for (const a of assets) {
    totalOtherAssets += Math.round(Number(a.value) || 0);
  }

  const totalAssets = liquidBalance + totalOtherAssets;

  let totalActiveDebt = 0;
  let totalActiveLoan = 0;

  for (const d of debts) {
    if (d.status === 'unpaid') {
      const amt = Math.round(Number(d.amount) || 0);
      if (d.type === 'debt') {
        totalActiveDebt += amt;
      } else {
        totalActiveLoan += amt;
      }
    }
  }

  const netWorth = totalAssets - totalActiveDebt;

  return {
    liquidBalance,
    totalOtherAssets,
    totalAssets,
    totalActiveDebt,
    totalActiveLoan,
    netWorth,
  };
}
