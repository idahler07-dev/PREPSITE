"use client";

/** The on/off pill switch (adapted from Uiverse, vinodjangid07): a real checkbox with role="switch". */
export function ToggleSwitch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <span className="uv-switch">
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
      <span className="uv-switch__track" aria-hidden />
    </span>
  );
}
