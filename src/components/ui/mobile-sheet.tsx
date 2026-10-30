"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AnimatePresence, m, useReducedMotion, type PanInfo } from "motion/react";
import { fade, spring } from "@/lib/motion";

/**
 * Bottom sheet for phones: scales/fades in with spring.soft over a blurred
 * backdrop; drag it down to close (velocity-based, so a quick flick works).
 */
export function MobileSheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 120 || info.velocity.y > 500) onOpenChange(false);
  }
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-50 bg-overlay backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}>
              <m.div
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t bg-surface px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg outline-none"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={reduce ? fade : spring.soft}
                drag={reduce ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={onDragEnd}
              >
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />
                <DialogPrimitive.Title className="mb-2 px-2 text-small font-semibold text-muted-foreground">{title}</DialogPrimitive.Title>
                {children}
              </m.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
