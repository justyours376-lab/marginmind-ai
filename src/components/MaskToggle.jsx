import { Eye, EyeOff, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLang } from '@/lib/i18n';

// Eye button for sensitive values. Open eye = click to reveal, closed eye = click to hide. A lock shows while revealed.
export default function MaskToggle({ shown, onToggle, hiddenKey = 'maskHidden', showKey = 'maskShow' }) {
  const { t } = useLang();
  const Icon = shown ? EyeOff : Eye;
  return (
    <span className="inline-flex items-center gap-0.5 shrink-0">
      {shown && <Lock className="w-3 h-3 text-gold-dark" aria-label={t('maskVisible')} />}
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" onClick={onToggle} aria-pressed={shown} aria-label={shown ? t('maskHide') : t(showKey)} className="p-1.5 rounded-full text-info hover:bg-info/10">
              <Icon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {shown ? t('maskHide') : <><span className="block">{t(hiddenKey)}</span><span className="block">{t(showKey)}</span></>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}