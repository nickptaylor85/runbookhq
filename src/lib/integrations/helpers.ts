import type { Severity } from './types';

export function normSev(val: string | number | undefined): Severity {
  if (val === undefined || val === null) return 'Medium';
  const s = String(val).toLowerCase();
  if (['critical','5','high critical','informational critical'].includes(s)) return 'Critical';
  if (['high','4','severe'].includes(s)) return 'High';
  if (['medium','3','moderate','warning'].includes(s)) return 'Medium';
  if (['low','2','1','info','informational'].includes(s)) return 'Low';
  // Numeric ranges
  const n = Number(val);
  if (!isNaN(n)) {
    if (n >= 9) return 'Critical';
    if (n >= 7) return 'High';
    if (n >= 4) return 'Medium';
    return 'Low';
  }
  return 'Medium';
}

export function tsToISO(ts: number | string): string {
  try {
    const n = typeof ts === 'string' ? parseInt(ts) : ts;
    return new Date(n > 1e12 ? n : n * 1000).toISOString();
  } catch(e) {
    return new Date().toISOString();
  }
}

export function safeId(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join('-').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 64);
}
