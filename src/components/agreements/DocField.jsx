import { useRef, useState } from 'react';
import { Loader2, Upload, Eye, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';

const MAX = 10 * 1024 * 1024;

// One private document (stored privately): upload, view through a short-lived signed link, or remove.
export default function DocField({ label, uri, onChange }) {
  const { t } = useLang();
  const { toast } = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX) { toast({ title: t('agrFileBig'), variant: 'destructive' }); return; }
    setBusy(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      onChange(file_uri);
    } catch { toast({ title: t('agrUploadFail'), variant: 'destructive' }); }
    setBusy(false);
  };
  const view = async () => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
    window.open(signed_url, '_blank', 'noopener');
  };

  const btn = 'inline-flex items-center gap-1 border rounded-full px-3 py-1.5 text-xs font-semibold';
  return (
    <div className="text-sm space-y-1">
      <p>{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={pick} />
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className={`${btn} border-brand text-brand disabled:opacity-60`}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}{busy ? t('agrUploading') : t('agrUpload')}
        </button>
        {uri && <span className="text-xs text-muted-foreground">{t('agrAttached')}</span>}
        {uri && <button type="button" onClick={view} className={btn}><Eye className="w-3 h-3" />{t('agrView')}</button>}
        {uri && <button type="button" onClick={() => onChange('')} className={`${btn} border-red-300 text-red-700`}><Trash2 className="w-3 h-3" />{t('agrRemove')}</button>}
      </div>
    </div>
  );
}