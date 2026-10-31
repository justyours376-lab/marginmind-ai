import { Input } from '@/components/ui/input';
import MaskedInput from '@/components/MaskedInput';

// `mask` ('id' | 'token' | 'email') turns on display masking with an eye toggle.
export default function Field({ label, value, onChange, type = 'text', mask }) {
  if (mask) return <MaskedInput label={label} value={value} onChange={onChange} kind={mask} />;
  return (
    <label className="block text-sm">{label}
      <Input type={type} autoComplete="off" className="mt-1 bg-white" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}