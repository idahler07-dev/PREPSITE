"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

// WebGL, loaded after the page is interactive; the hero reads fine without it.
const GradientWaves = dynamic(() => import("@/components/fx/GradientWaves"), { ssr: false });

/**
 * A slow cobalt-to-lilac wave behind the hero, faded out toward the bottom. It
 * stands still for reduced motion and while off screen (handled by the component).
 */
export function HeroWaves() {
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme !== "dark";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-60 [mask-image:linear-gradient(to_bottom,black_30%,transparent)] dark:opacity-50"
    >
      <GradientWaves
        horizonColor={light ? "#7f93ff" : "#2747f5"}
        waveColor={light ? "#c9bfff" : "#8f7cff"}
        crestColor={light ? "#ffffff" : "#c8d2ff"}
        lightMode={light}
        speed={0.25}
        amplitude={1.6}
        mouseInteraction={false}
        swellOnClick={false}
        quality="low"
        grain={0.1}
        dpr={1.5}
      />
    </div>
  );
}
