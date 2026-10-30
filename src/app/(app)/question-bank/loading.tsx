import { Container } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="space-y-6">
      <div className="contents" aria-busy="true" aria-live="polite">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      </div>
      </div>
    </Container>
  );
}
