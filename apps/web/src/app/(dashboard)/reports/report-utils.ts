// Shared utilities for report pages
export function buildReportParams(
  startDate: string,
  endDate: string,
  extra?: Record<string, string>
): string {
  const p = new URLSearchParams();
  if (startDate) p.set('startDate', startDate);
  if (endDate) p.set('endDate', endDate);
  p.set('page', '1');
  p.set('limit', '100');
  if (extra) Object.entries(extra).forEach(([k, v]) => { if (v) p.set(k, v); });
  return p.toString();
}

export function fmtCurrency(v: number | string | null | undefined): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v) || 0);
}

export function getDefaultDates(): { start: string; end: string } {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: firstDay.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
}
