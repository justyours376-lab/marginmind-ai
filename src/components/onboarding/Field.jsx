import { Input } from '@/components/ui/input';

export default function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block text-sm">{label}
      <Input type={type} autoComplete="off" className="mt-1 bg-white" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}