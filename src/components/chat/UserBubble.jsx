import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

// The user's own selection. Long-press (or right-click) shows a delete option that removes this
// selection and everything after it from the chat only.
export default function UserBubble({ text, label, onDelete, disabled }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const cancel = () => clearTimeout(timer.current);
  const start = () => { if (disabled) return; cancel(); timer.current = setTimeout(() => setOpen(true), 500); };
  useEffect(() => cancel, []);
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(id);
  }, [open]);

  return (
    <div className="flex justify-end items-center gap-2">
      {open && !disabled && (
        <button onClick={() => { setOpen(false); onDelete(); }} className="flex items-center gap-1 text-xs text-white bg-danger rounded-full px-3 py-1.5">
          <Trash2 className="w-3.5 h-3.5" />{label}
        </button>
      )}
      <div
        data-testid="user-bubble"
        onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
        onContextMenu={(e) => { e.preventDefault(); if (!disabled) setOpen(true); }}
        className="bg-brand text-white rounded-2xl rounded-tr-sm px-4 py-2 text-sm select-none [-webkit-touch-callout:none]"
      >{text}</div>
    </div>
  );
}