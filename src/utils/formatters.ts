export function formatIDR(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'Rp 0';
  }
  const isNegative = value < 0;
  const absValue = Math.abs(Math.round(value));
  const formatted = new Intl.NumberFormat('id-ID').format(absValue);
  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthYear(monthStr: string): string {
  // expects 'YYYY-MM'
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const monthIdx = parseInt(month, 10) - 1;
  return `${MONTH_NAMES_ID[monthIdx] || month} ${year}`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${MONTH_NAMES_ID[monthIdx]} ${year}`;
    }
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function getCurrentMonthStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
