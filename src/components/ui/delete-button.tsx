import type { ComponentProps } from "react";

/** A round trash icon that widens into a labelled pill on hover or keyboard focus (`label` is the full name for screen readers, `text` the short word shown) (adapted from Uiverse, vinodjangid07). */
export function DeleteButton({ label, text, ...props }: Omit<ComponentProps<"button">, "children"> & { label: string; text?: string }) {
  return (
    <button type="button" className="uv-trash" aria-label={label} {...props}>
      <svg viewBox="0 0 448 512" aria-hidden>
        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
      </svg>
      <span aria-hidden>{text ?? label}</span>
    </button>
  );
}
