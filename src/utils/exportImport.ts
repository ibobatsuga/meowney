import { z } from 'zod';
import { db } from '../db';
import type { BudgetSetup, Transaction, Pocket, DebtLoan, Asset, ReflectionData } from '../types';
import Papa from 'papaparse';

// Schema validation using Zod (FR-18)
export const exportDataSchema = z.object({
  schemaVersion: z.string(),
  exportedAt: z.string(),
  app: z.literal('Meowney'),
  data: z.object({
    setups: z.array(z.any()),
    transactions: z.array(z.any()),
    pockets: z.array(z.any()),
    debts: z.array(z.any()),
    assets: z.array(z.any()),
    reflections: z.array(z.any()),
  })
});

export async function exportAllDataJSON(): Promise<string> {
  const setups = await db.setups.toArray();
  const transactions = await db.transactions.toArray();
  const pockets = await db.pockets.toArray();
  const debts = await db.debts.toArray();
  const assets = await db.assets.toArray();
  const reflections = await db.reflections.toArray();

  const payload = {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    app: 'Meowney',
    data: {
      setups,
      transactions,
      pockets,
      debts,
      assets,
      reflections,
    }
  };

  return JSON.stringify(payload, null, 2);
}

export function downloadFile(content: string, filename: string, contentType = 'application/json') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDataJSON(jsonString: string): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const raw = JSON.parse(jsonString);
    const parsed = exportDataSchema.safeParse(raw);

    if (!parsed.success) {
      return {
        success: false,
        message: 'Format berkas JSON tidak sesuai skema Meowney: ' + parsed.error.issues.map(i => i.message).join(', ')
      };
    }

    const { setups, transactions, pockets, debts, assets, reflections } = parsed.data.data;

    // Atomic transaction in Dexie
    await db.transaction('rw', [db.setups, db.transactions, db.pockets, db.debts, db.assets, db.reflections], async () => {
      await db.setups.clear();
      await db.transactions.clear();
      await db.pockets.clear();
      await db.debts.clear();
      await db.assets.clear();
      await db.reflections.clear();

      if (setups.length) await db.setups.bulkAdd(setups);
      if (transactions.length) await db.transactions.bulkAdd(transactions);
      if (pockets.length) await db.pockets.bulkAdd(pockets);
      if (debts.length) await db.debts.bulkAdd(debts);
      if (assets.length) await db.assets.bulkAdd(assets);
      if (reflections.length) await db.reflections.bulkAdd(reflections);
    });

    const totalCount = transactions.length + pockets.length + setups.length;
    return {
      success: true,
      message: `Berhasil mengimpor data (${transactions.length} transaksi, ${pockets.length} kantong, ${setups.length} setup).`,
      count: totalCount
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Gagal membaca berkas JSON: ' + (err?.message || 'Format tidak valid')
    };
  }
}

// CSV Parser for Bank / E-Wallet Statements (FR-29)
export interface ParsedCSVRow {
  date: string;
  amount: number;
  mode: 'expense' | 'income';
  description: string;
  pocketId: string;
}

export function parseCSVStatement(fileContent: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}
