"use client";

import { useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { LazyMotion } from "motion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeMeta } from "@/components/layout/theme-toggle";

const loadMotionFeatures = () => import("@/lib/motion-features").then((r) => r.default);

export function Providers({ children, nonce }: { children: ReactNode; nonce?: string }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
      {/* Components use <m.*>; layout/animation features load after first paint. */}
      <LazyMotion features={loadMotionFeatures} strict>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          {children}
          <ThemeMeta />
          <Toaster position="top-center" />
        </TooltipProvider>
      </QueryClientProvider>
      </LazyMotion>
    </ThemeProvider>
  );
}
