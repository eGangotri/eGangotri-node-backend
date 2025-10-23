import * as xlsx from 'xlsx';

// Returns SheetJS column info array sized to fit largest value per column
export function autoFitColumnsForAoa(aoa: any[][], options?: { min?: number; max?: number; pad?: number }): xlsx.ColInfo[] {
  const { min = 10, max = 80, pad = 2 } = options || {};
  if (!aoa || aoa.length === 0) return [];
  const colCount = Math.max(...aoa.map(r => r.length));
  const colWidths = new Array(colCount).fill(0);
  for (const row of aoa) {
    for (let c = 0; c < colCount; c++) {
      const v = row[c];
      const s = v === null || v === undefined ? '' : String(v);
      colWidths[c] = Math.max(colWidths[c], s.length);
    }
  }
  return colWidths.map(w => ({ wch: Math.min(Math.max(w + pad, min), max) }));
}

// Computes sums for the specified 0-based column indices over the given AOA rows.
// startRow: row index to start summing from (default 1 to skip header)
export function computeColumnSums(aoa: any[][], cols: number[], startRow = 1): Record<number, number> {
  const sums: Record<number, number> = {};
  cols.forEach(c => (sums[c] = 0));
  for (let r = startRow; r < aoa.length; r++) {
    const row = aoa[r] || [];
    for (const c of cols) {
      const raw = row[c];
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
      if (!isNaN(num)) sums[c] += num;
    }
  }
  return sums;
}
