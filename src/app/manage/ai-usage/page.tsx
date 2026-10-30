import { getFormatter, getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/auth/session";
import { aiAvailable } from "@/server/ai/client";
import { dayInZone, startOfDayInZone } from "@/lib/stats/streak";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DAYS = 30;

/** Estimated AI spend (from src/config/ai-pricing.ts), by feature, model, day and user. */
export default async function AiUsagePage() {
  await requireOwner();
  const t = await getTranslations("admin.aiUsage");
  const format = await getFormatter();
  const tz = siteConfig.defaultTimeZone;
  const today = startOfDayInZone(new Date(), tz);
  const since = new Date(today.getTime() - (DAYS - 1) * 86_400_000);

  const [rows, byFeature, byModel, byUser] = await Promise.all([
    db.aiUsage.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, costMicroUsd: true } }),
    db.aiUsage.groupBy({ by: ["feature"], where: { createdAt: { gte: since } }, _sum: { costMicroUsd: true, inputTokens: true, outputTokens: true }, _count: true }),
    db.aiUsage.groupBy({ by: ["model"], where: { createdAt: { gte: since } }, _sum: { costMicroUsd: true }, _count: true }),
    db.aiUsage.groupBy({ by: ["userId"], where: { createdAt: { gte: since }, userId: { not: null } }, _sum: { costMicroUsd: true }, _count: true, orderBy: { _sum: { costMicroUsd: "desc" } }, take: 10 }),
  ]);
  const users = new Map(
    (await db.user.findMany({ where: { id: { in: byUser.map((u) => u.userId!) } }, select: { id: true, email: true, name: true } })).map((u) => [u.id, u.name ?? u.email ?? u.id]),
  );
  const usd = (micro: number | null | undefined) => format.number((micro ?? 0) / 1_000_000, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
  const daily = new Map<string, { calls: number; cost: number }>();
  for (const r of rows) {
    const d = dayInZone(r.createdAt, tz);
    const v = daily.get(d) ?? { calls: 0, cost: 0 };
    v.calls++;
    v.cost += r.costMicroUsd;
    daily.set(d, v);
  }
  const todayKey = dayInZone(new Date(), tz);
  const total = rows.reduce((s, r) => s + r.costMicroUsd, 0);
  const max = Math.max(1, ...[...daily.values()].map((v) => v.cost));
  const days = Array.from({ length: DAYS }, (_, i) => dayInZone(new Date(since.getTime() + i * 86_400_000 + 12 * 3_600_000), tz));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle", { days: DAYS })} />
      {!aiAvailable() && <p className="rounded-md border p-3 text-sm">{t("disabled")}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t("today"), value: usd(daily.get(todayKey)?.cost) },
          { label: t("period", { days: DAYS }), value: usd(total) },
          { label: t("calls", { days: DAYS }), value: format.number(rows.length) },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold tabular-nums">{s.value}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("perDay")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex h-32 items-end gap-1" aria-label={t("perDay")}>
            {days.map((d) => {
              const v = daily.get(d);
              return (
                <li key={d} className="flex h-full flex-1 flex-col justify-end" title={`${d}: ${usd(v?.cost)} · ${v?.calls ?? 0}`}>
                  <span className="sr-only">
                    {d}: {usd(v?.cost)}
                  </span>
                  <div className="rounded-t bg-primary" style={{ height: `${((v?.cost ?? 0) / max) * 100}%`, minHeight: v ? 2 : 0 }} />
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("byFeature")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("feature")}</TableHead>
                  <TableHead className="text-end">{t("callsShort")}</TableHead>
                  <TableHead className="text-end">{t("tokens")}</TableHead>
                  <TableHead className="text-end">{t("cost")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byFeature.map((f) => (
                  <TableRow key={f.feature}>
                    <TableCell>{t.has(`features.${f.feature as "tutor"}`) ? t(`features.${f.feature as "tutor"}`) : f.feature}</TableCell>
                    <TableCell className="text-end tabular-nums">{f._count}</TableCell>
                    <TableCell className="text-end tabular-nums">{format.number((f._sum.inputTokens ?? 0) + (f._sum.outputTokens ?? 0))}</TableCell>
                    <TableCell className="text-end tabular-nums">{usd(f._sum.costMicroUsd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {byModel.map((m) => (
                <li key={m.model}>
                  {m.model}: {m._count} · {usd(m._sum.costMicroUsd)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("topUsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead className="text-end">{t("callsShort")}</TableHead>
                  <TableHead className="text-end">{t("cost")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byUser.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell className="max-w-48 truncate">{users.get(u.userId!) ?? "—"}</TableCell>
                    <TableCell className="text-end tabular-nums">{u._count}</TableCell>
                    <TableCell className="text-end tabular-nums">{usd(u._sum.costMicroUsd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  );
}
