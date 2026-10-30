import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { Link } from "@/i18n/navigation";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/admin/pagination";

const PAGE = 25;

export async function generateMetadata() {
  const t = await getTranslations("history");
  return { title: t("title") };
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser("/history");
  const t = await getTranslations("history");
  const format = await getFormatter();
  const page = z.coerce.number().int().min(1).catch(1).parse((await searchParams).page);
  const [total, attempts] = await Promise.all([
    db.attempt.count({ where: { userId: user.id } }),
    db.attempt.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, kind: true, status: true, startedAt: true, correctCount: true, totalCount: true, modules: { select: { _count: { select: { responses: true } } } } },
    }),
  ]);
  return (
    <Container className="max-w-4xl">
      <PageHeader title={t("title")} />
      {attempts.length === 0 ? (
        <EmptyState
          pose="point"
          body={t("empty")}
          action={
            <Button asChild>
              <Link href="/practice">{t("emptyCta")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.date")}</TableHead>
                <TableHead>{t("columns.type")}</TableHead>
                <TableHead>{t("columns.questions")}</TableHead>
                <TableHead>{t("columns.score")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={a.status === "IN_PROGRESS" ? `/test/${a.id}` : `/attempts/${a.id}`} className="text-primary hover:underline">
                      {format.dateTime(a.startedAt, { dateStyle: "medium", timeStyle: "short" })}
                    </Link>
                  </TableCell>
                  <TableCell>{t(`kinds.${a.kind}`)}</TableCell>
                  <TableCell className="tabular-nums">{a.modules.reduce((s, m) => s + m._count.responses, 0)}</TableCell>
                  <TableCell className="tabular-nums">{a.status === "COMPLETED" ? `${a.correctCount ?? 0}/${a.totalCount ?? 0}` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === "COMPLETED" ? "default" : "secondary"}>{t(`statuses.${a.status}`)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE))} total={total} pageSize={PAGE} />
    </Container>
  );
}
