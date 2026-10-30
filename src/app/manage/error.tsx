"use client";

import { RouteError } from "@/components/layout/route-states";

export default function Error({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
