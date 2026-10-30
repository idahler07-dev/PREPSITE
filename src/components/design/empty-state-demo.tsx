import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";

const COPY = { body: "No mistakes to review yet. Nice work!", cta: "Start a drill" };

export function EmptyStateDemo() {
  return <EmptyState pose="cheer" body={COPY.body} action={<Button>{COPY.cta}</Button>} />;
}
