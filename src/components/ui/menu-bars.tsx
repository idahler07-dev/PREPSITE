/** Three bars that fold into an arrow when `open` (adapted from Uiverse, vinodjangid07). Drawn at 40px, shown at ~22px. */
export function MenuBars({ open = false }: { open?: boolean }) {
  return (
    <span className="relative block size-[22px]" aria-hidden>
      <span className="absolute top-0 left-0 origin-top-left scale-[0.55]">
        <span className="uv-bars" data-open={open}>
          <i />
          <i />
          <i />
        </span>
      </span>
    </span>
  );
}
