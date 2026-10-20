import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export default function ListingCard({ listing, demo }) {
  const { t } = useLang();
  return (
    <div className="bg-white rounded-2xl p-4 border border-black/5 max-w-md">
      <p className="text-xs text-muted-foreground">{t('ordered')}</p>
      <div className="flex gap-3 mt-2">
        <img src={listing.photos?.[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-emerald-700 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" />{t('listingLive')}</p>
          <p className="text-sm truncate">{listing.title}</p>
          <p className="text-sm font-bold text-brand">${listing.price}</p>
        </div>
      </div>
      <a href={listing.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-brand font-semibold underline">{t('viewListing')} <ExternalLink className="w-3 h-3" /></a>
      {demo && <p className="text-xs text-muted-foreground mt-2">{t('demoNoCharge')}</p>}
    </div>
  );
}