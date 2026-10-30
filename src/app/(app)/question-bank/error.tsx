"use client";

import { RouteError } from "@/components/layout/route-states";

export default function BankError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
