import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

// Escape quotes and neutralise spreadsheet formulas.
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

// Every audit entry of this user, newest first, page by page.
export async function fetchAllAudit(userId) {
  const all = [];
  let cursor;
  for (let i = 0; i < 200; i++) {
    const page = await base44.entities.AuditLog.filter({ created_by_id: userId }, { sort: '-created_date', limit: 500, ...(cursor ? { cursor } : {}) });
    all.push(...page.items);
    if (!page.has_more) break;
    cursor = page.next_cursor;
  }
  return all;
}

// Builds the CSV from all entries and starts the browser download. Returns how many entries were written.
export async function downloadAuditCsv(userId) {
  const all = await fetchAllAudit(userId);
  const rows = [['date', 'action', 'actor_email', 'amount', 'details'], ...all.map((a) => [a.created_date, a.action, a.actor_email, a.amount, a.details])];
  const blob = new Blob(['\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  return all.length;
}