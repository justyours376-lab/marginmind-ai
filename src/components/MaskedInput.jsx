import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import MaskToggle from '@/components/MaskToggle';
import { maskers } from '@/lib/mask';

// Input that shows a masked copy of its value until the eye is clicked. The real value in state is never changed.
// While masked, an existing value is read-only; an empty field can still be typed into (shown as dots) so new entries work.
export default function MaskedInput({ label, value, onChange, kind = 'id', revealedType = 'text', className = '' }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [editing, setEditing] = useState(false);
  const v = value || '';
  const editable = shown || !v || editing;
  const display = shown ? v : editing || !v ? v : maskers[kind](v);
  return (
    <div className={`text-sm ${className}`}>
      <label htmlFor={id}>{label}</label>
      <div className="mt-1 flex items-center gap-1">
        <Input
          id={id} autoComplete="off" className="bg-white"
          type={shown ? revealedType : editable ? 'password' : 'text'}
          readOnly={!editable} value={display}
          onFocus={() => editable && setEditing(true)} onBlur={() => setEditing(false)}
          onChange={(e) => onChange(e.target.value)}
        />
        <MaskToggle shown={shown} onToggle={() => setShown((s) => !s)} />
      </div>
    </div>
  );
}