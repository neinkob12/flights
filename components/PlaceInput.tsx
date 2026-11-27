"use client";
import { useEffect, useRef, useState } from "react";

type Place = { code: string; label: string };

export function PlaceInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (code: string) => void; placeholder?: string;
}) {
  const [text, setText] = useState(value);
  const [items, setItems] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    const term = text.trim();
    if (term.length < 2 || /^[A-Z]{3} · /.test(text)) { setItems([]); return; }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/places?term=${encodeURIComponent(term)}`).then((r) => r.json()).catch(() => []);
      setItems(r); setIdx(0); setOpen(true);
    }, 180);
  }, [text]);

  const pick = (p: Place) => { onChange(p.code); setText(`${p.code} · ${p.label}`); setOpen(false); };

  return (
    <div className="ac">
      <label>{label}</label>
      <input
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          const raw = e.target.value.trim().toUpperCase();
          onChange(/^[A-Z]{3}$/.test(raw) ? raw : "");
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); pick(items[idx]); }
        }}
      />
      {open && items.length > 0 && (
        <ul role="listbox">
          {items.map((p, i) => (
            <li key={p.code + i} aria-selected={i === idx} onMouseDown={() => pick(p)}><b>{p.code}</b>{p.label}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
