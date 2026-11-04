"use client";

/**
 * The day/night switch: sky with clouds by day, stars and a moon by night
 * (adapted from Uiverse, Galahhad). A real checkbox with role="switch" sits on
 * top, so it works by keyboard and with screen readers. Size it with `size` (px).
 */
export function DayNightSwitch({ dark, onChange, label, size = 9 }: { dark: boolean; onChange: (dark: boolean) => void; label: string; size?: number }) {
  return (
    <span className="theme-switch" style={{ "--toggle-size": `${size}px` } as React.CSSProperties}>
      <input className="theme-switch__checkbox" type="checkbox" role="switch" checked={dark} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
      <span className="theme-switch__container" aria-hidden>
        <span className="theme-switch__clouds" />
        <svg className="theme-switch__stars-container" viewBox="0 0 144 55" fill="currentColor">
          <path d="M135.8 3.7l1.1 3.1 3.1 1.1-3.1 1.1-1.1 3.1-1.1-3.1-3.1-1.1 3.1-1.1zM104.2 26.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9zM118 41l1.3 3.6 3.6 1.3-3.6 1.3L118 50.8l-1.3-3.6-3.6-1.3 3.6-1.3zM86 10.5l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8zM60.5 36l1.1 3 3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1zM44 8l1.4 3.8 3.8 1.4-3.8 1.4L44 18.4l-1.4-3.8-3.8-1.4 3.8-1.4zM20 28l.9 2.4 2.4.9-2.4.9L20 34.6l-.9-2.4-2.4-.9 2.4-.9zM9 5l.7 1.9 1.9.7-1.9.7L9 10.2l-.7-1.9-1.9-.7 1.9-.7zM28 47l.8 2.1 2.1.8-2.1.8L28 52.8l-.8-2.1-2.1-.8 2.1-.8zM76 46l.6 1.7 1.7.6-1.7.6L76 50.6l-.6-1.7-1.7-.6 1.7-.6zM96 5l.6 1.7 1.7.6-1.7.6L96 9.6l-.6-1.7-1.7-.6 1.7-.6z" />
        </svg>
        <span className="theme-switch__circle-container">
          <span className="theme-switch__sun-moon-container">
            <span className="theme-switch__moon">
              <span className="theme-switch__spot" />
              <span className="theme-switch__spot" />
              <span className="theme-switch__spot" />
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}
