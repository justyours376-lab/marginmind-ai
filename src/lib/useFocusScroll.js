import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Notification deep links look like /orders?focus=order-<id>. Once the page data is ready, scroll to that element and highlight it briefly.
export function useFocusScroll(ready) {
  const { search } = useLocation();
  useEffect(() => {
    const id = new URLSearchParams(search).get('focus');
    const el = ready && id ? document.getElementById(id) : null;
    if (!el) return undefined;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.add('ring-2', 'ring-gold', 'rounded-2xl');
    const timer = setTimeout(() => el.classList.remove('ring-2', 'ring-gold'), 2500);
    return () => clearTimeout(timer);
  }, [search, ready]);
}