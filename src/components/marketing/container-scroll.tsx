"use client";

import { useRef, type ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useMediaQuery } from "@/lib/use-media-query";

/**
 * A device frame that tilts back and settles flat as it scrolls into view,
 * the title lifting with it (after Aceternity's "container scroll"). Reduced
 * motion: no tilt or lift.
 */
export function ContainerScroll({ title, children }: { title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const mobile = useMediaQuery("(max-width: 768px)");
  const reduce = useReducedMotion();
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : mobile ? [0.85, 0.95] : [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -100]);

  return (
    <div ref={ref} className="relative flex h-[50rem] items-center justify-center p-2 md:h-[72rem] md:p-20">
      <div className="relative w-full py-10 md:py-32" style={{ perspective: "1000px" }}>
        <m.div style={{ translateY: translate }} className="mx-auto max-w-5xl px-4 text-center">
          {title}
        </m.div>
        <m.div
          style={{
            rotateX: rotate,
            scale,
            boxShadow: "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
          }}
          className="mx-auto -mt-12 h-[34rem] w-full max-w-[22rem] rounded-[30px] border-4 border-[#6c6c6c] bg-[#222] p-2 md:h-[40rem] md:max-w-5xl md:p-5"
        >
          <div className="h-full w-full overflow-hidden rounded-2xl bg-surface">{children}</div>
        </m.div>
      </div>
    </div>
  );
}
