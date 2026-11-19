import { useEffect, useState } from "react";

/** Modal warning. If checkLabel is given, the person must tick the box before confirming. */
export default function ConfirmDialog({ open, title, children, confirmText = "Confirm", checkLabel, tone = "brand", busy, onConfirm, onCancel }) {
  const [checked, setChecked] = useState(false);
  useEffect(() => { setChecked(false); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  const ready = !checkLabel || checked;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className={`text-lg font-bold ${tone === "warn" ? "text-amber" : ""}`}>{title}</h2>
        <div className="mt-3 space-y-2 text-sm text-ink/80">{children}</div>
        {checkLabel && (
          <label className="mt-4 flex items-start gap-2 text-sm font-medium">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={checked} onChange={(e) => setChecked(e.target.checked)} />{checkLabel}
          </label>)}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>Go back</button>
          <button type="button" className={tone === "warn" ? "btn-warn" : "btn-primary"} disabled={!ready || busy} onClick={onConfirm}>{busy ? "Please wait…" : confirmText}</button>
        </div>
      </div>
    </div>
  );
}
