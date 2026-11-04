/**
 * The loading animation: a pencil draws a circle, then erases it (adapted from
 * Uiverse, gustavofusco). `size` is in px. It stands still with reduced motion.
 * Wrap it in an element with role="status" and a text label.
 */
export function PencilLoader({ size = 64 }: { size?: number }) {
  return (
    <span className="inline-block text-muted-foreground" style={{ fontSize: size / 10 }} aria-hidden>
      <svg className="pencil" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="pencil-eraser">
            <rect rx="5" ry="5" width="30" height="30" />
          </clipPath>
        </defs>
        <circle className="pencil__stroke" r="70" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="439.82 439.82" strokeDashoffset="439.82" strokeLinecap="round" transform="rotate(-113,100,100)" />
        <g className="pencil__rotate" transform="translate(100,100)">
          <circle className="pencil__body1" fill="none" stroke="var(--primary)" strokeWidth="30" r="64" strokeDasharray="402.12 402.12" strokeDashoffset="402" transform="rotate(-90)" />
          <circle className="pencil__body2" fill="none" stroke="color-mix(in oklab, var(--primary), white 30%)" strokeWidth="10" r="74" strokeDasharray="464.96 464.96" strokeDashoffset="465" transform="rotate(-90)" />
          <circle className="pencil__body3" fill="none" stroke="color-mix(in oklab, var(--primary), black 25%)" strokeWidth="10" r="54" strokeDasharray="339.29 339.29" strokeDashoffset="339" transform="rotate(-90)" />
          <g className="pencil__eraser" transform="rotate(-90) translate(49,0)">
            <g className="pencil__eraser-skew">
              <rect fill="#ff8a6e" rx="5" ry="5" width="30" height="30" />
              <rect fill="#ff6b4a" width="5" height="30" clipPath="url(#pencil-eraser)" />
              <rect fill="#e8ecf4" width="30" height="20" />
              <rect fill="#b9c1d3" width="15" height="20" />
              <rect fill="#d3d9e6" width="5" height="20" />
              <rect fill="rgba(0,0,0,0.2)" y="6" width="30" height="2" />
              <rect fill="rgba(0,0,0,0.2)" y="13" width="30" height="2" />
            </g>
          </g>
          <g className="pencil__point" transform="rotate(-90) translate(49,-30)">
            <polygon fill="#f7c58a" points="15 0,30 30,0 30" />
            <polygon fill="#f0a24a" points="15 0,6 30,0 30" />
            <polygon fill="#1c2540" points="15 0,20 10,10 10" />
          </g>
        </g>
      </svg>
    </span>
  );
}
