import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction, BudgetSetup, Pocket } from '../types';
import { formatIDR, formatMonthYear, formatDateIndo, MONTH_NAMES_ID } from './formatters';
import { calculateMonthlySummary, calculatePlanVsActual } from './calculator';
import Papa from 'papaparse';

export function exportMonthlyCSV(transactions: Transaction[], month: string) {
  const monthTxs = transactions.filter(t => t.month === month || t.date.startsWith(month));
  const data = monthTxs.map(t => ({
    'ID': t.id,
    'Tanggal': t.date,
    'Tipe': t.mode === 'expense' ? 'Pengeluaran' : t.mode === 'income' ? 'Pemasukan' : t.mode === 'transfer' ? 'Pindah Dana' : 'Jual Aset',
    'Kategori / Sumber': t.categoryOrSource,
    'Nominal (IDR)': t.amount,
    'Mood': t.mood || '-',
    'Kantong Asal': t.pocketId,
    'Kantong Tujuan': t.destinationPocketId || '-',
    'Catatan': t.note || ''
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Transaksi-${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMonthlyPDF(
  month: string,
  setup: BudgetSetup | undefined,
  transactions: Transaction[],
  pockets: Pocket[]
) {
  const doc = new jsPDF();
  const monthLabel = formatMonthYear(month);
  const summary = calculateMonthlySummary(transactions, month);
  const planVsActual = calculatePlanVsActual(setup, summary.expenseByCategory);

  // Brand Header
  doc.setFillColor(217, 45, 32); // Cat red
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MEOWNEY', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Anggaran Generasi Sandwich', 60, 18);

  // Document Title
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Laporan Keuangan Bulanan: ${monthLabel}`, 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Local-first Data`, 14, 44);

  // Summary Metrics Table
  autoTable(doc, {
    startY: 48,
    head: [['Ringkasan Arus Kas', 'Nominal (IDR)']],
    body: [
      ['Total Pemasukan', formatIDR(summary.totalIncome)],
      ['Total Pengeluaran', formatIDR(summary.totalExpense)],
      ['Arus Kas Bersih (Surplus / Defisit)', formatIDR(summary.netCashflow)],
      ['Rencana Total Anggaran', formatIDR(setup?.income || 0)],
      ['Jumlah Transaksi', `${summary.transactionCount} transaksi`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [217, 45, 32] },
    styles: { fontSize: 9 }
  });

  // Category Plan vs Actual Table
  const lastY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Perbandingan Rencana vs Aktual per Kategori', 14, lastY);

  const categoryRows = planVsActual.map(row => [
    row.category,
    formatIDR(row.planned),
    formatIDR(row.actual),
    formatIDR(row.diff),
    `${row.percentUsed}%`,
    row.status
  ]);

  autoTable(doc, {
    startY: lastY + 4,
    head: [['Kategori', 'Rencana', 'Realisasi', 'Selisih', '% Terpakai', 'Status']],
    body: categoryRows.length > 0 ? categoryRows : [['Tidak ada data alokasi atau pengeluaran', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'Perlu adjust') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    }
  });

  // Emotional Spending Table if available
  const moodEntries = Object.entries(summary.expenseByMood);
  if (moodEntries.length > 0) {
    const nextY = (doc as any).lastAutoTable.finalY + 10;
    if (nextY < 240) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Pola Emosi Belanja (Emotional Spending)', 14, nextY);

      const moodRows = moodEntries.map(([mood, val]) => [
        mood,
        `${val.count}x`,
        formatIDR(val.total),
        `${Math.round((val.total / (summary.totalExpense || 1)) * 100)}%`
      ]);

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Mood', 'Frekuensi', 'Total Pengeluaran', 'Porsi dari Total']],
        body: moodRows,
        theme: 'plain',
        headStyles: { fillColor: [249, 115, 22] },
        styles: { fontSize: 8 }
      });
    }
  }

  // File naming convention strictly per PRD FR-12: "Laporan-[Bulan]-[Tahun].pdf"
  const [yearStr, monthNumStr] = month.split('-');
  const monthName = MONTH_NAMES_ID[parseInt(monthNumStr, 10) - 1] || monthNumStr;
  doc.save(`Laporan-${monthName}-${yearStr}.pdf`);
}
