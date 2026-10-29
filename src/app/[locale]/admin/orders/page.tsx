import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/server/auth/session";
import { enabledProviders } from "@/server/payments";
import { formatMoney } from "@/server/payments/notify";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GrantPremiumForm, OrderActions } from "@/components/admin/billing-forms";

const STATUSES = ["CREATED", "PENDING", "PAID", "FAILED", "CANCELED", "REFUNDED"] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireRole(["ADMIN"], "/admin/orders");
  const sp = await searchParams;
  const t = await getTranslations("admin.orders");
  const tb = await getTranslations("billing");
  const format = await getFormatter();
  const locale = await getLocale();
  const status = STATUSES.find((s) => s === sp.status);
  const q = sp.q?.trim();
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? (/^\d+$/.test(q) ? { number: Number(q) } : { user: { email: { contains: q, mode: "insensitive" } } }) : {}),
  };
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [orders, paid30, activeSubs] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true, name: true } }, promoCode: { select: { code: true } } } }),
    db.order.groupBy({ by: ["currency"], where: { status: "PAID", paidAt: { gte: since } }, _sum: { amount: true }, _count: true }),
    db.subscription.findMany({ where: { canceledAt: null, endsAt: { gt: new Date() } }, distinct: ["userId"], select: { userId: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle", { providers: enabledProviders().map((p) => p.id).join(", ") || "—" })} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("activeSubscribers")}</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">{activeSubs.length}</CardContent>
        </Card>
        {paid30.map((p) => (
          <Card key={p.currency}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("revenue30", { count: p._count })}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold tabular-nums">{formatMoney(p._sum.amount ?? 0, p.currency as "UZS", locale)}</CardContent>
          </Card>
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-2" role="search">
        <Input name="q" defaultValue={q} placeholder={t("search")} aria-label={t("search")} className="w-64" />
        <select name="status" defaultValue={status ?? ""} aria-label={tb("receipt.status")} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {tb(`status.${s}`)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          {t("filter")}
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tb("receipt.number")}</TableHead>
            <TableHead>{tb("receipt.customer")}</TableHead>
            <TableHead>{tb("receipt.plan")}</TableHead>
            <TableHead>{tb("receipt.amount")}</TableHead>
            <TableHead>{tb("receipt.provider")}</TableHead>
            <TableHead>{tb("receipt.status")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono">
                {o.number}
                <span className="block text-xs text-muted-foreground">{format.dateTime(o.createdAt, { dateStyle: "short", timeStyle: "short" })}</span>
              </TableCell>
              <TableCell className="max-w-48 truncate">{o.user.email ?? o.user.name}</TableCell>
              <TableCell>
                {tb(`plans.${o.planId as "monthly"}.name`)}
                {o.promoCode && <span className="block font-mono text-xs text-muted-foreground">{o.promoCode.code}</span>}
                {o.referral && <span className="block text-xs text-muted-foreground">{t("referral")}</span>}
              </TableCell>
              <TableCell className="tabular-nums">{formatMoney(o.amount, o.currency as "UZS", locale)}</TableCell>
              <TableCell>{o.provider}</TableCell>
              <TableCell>
                <Badge variant={o.status === "PAID" ? "default" : o.status === "REFUNDED" || o.status === "FAILED" ? "destructive" : "secondary"}>{tb(`status.${o.status}`)}</Badge>
                {o.refundRequestedAt && o.status === "PAID" && <span className="block text-xs text-muted-foreground">{t("refundRequested")}</span>}
                {o.failureReason && <span className="block max-w-40 truncate text-xs text-muted-foreground">{o.failureReason}</span>}
              </TableCell>
              <TableCell className="space-x-2 whitespace-nowrap">
                {(o.status === "PAID" || o.status === "REFUNDED") && (
                  <Link href={`/billing/receipts/${o.id}`} className="text-sm underline">
                    {tb("page.receipt")}
                  </Link>
                )}
                {o.status === "PAID" && <OrderActions orderId={o.id} provider={o.provider} refundRequested={!!o.refundRequestedAt} />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {orders.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("grantTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <GrantPremiumForm />
        </CardContent>
      </Card>
    </div>
  );
}
