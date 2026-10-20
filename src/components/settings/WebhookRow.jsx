import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { useLang } from '@/lib/i18n';

export default function WebhookRow({ stage, label, value, onChange }) {
  const { t } = useLang();
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true); setRes(null);
    try { setRes((await base44.functions.invoke('testWebhook', { stage, url: value })).data); }
    catch { setRes({ ok: false, reason: 'other' }); }
    setBusy(false);
  };
  return (
    <div className="text-sm">{label}
      <div className="flex gap-2 mt-1">
        <Input placeholder="https://your-n8n.app/webhook/..." value={value} onChange={(e) => { onChange(e.target.value); setRes(null); }} />
        <button onClick={run} disabled={busy} className="px-4 rounded-md border border-brand text-brand font-semibold whitespace-nowrap flex items-center gap-1">
          {busy && <Loader2 className="w-3 h-3 animate-spin" />}{busy ? t('testing') : t('test')}
        </button>
      </div>
      {res && <p className={`text-xs mt-1 ${res.ok ? 'text-emerald-700' : 'text-red-600'}`}>{res.ok ? t('connectedOk') : `${t('failedX')}: ${t(`reason_${res.reason}`, { status: res.status })}`}</p>}
    </div>
  );
}