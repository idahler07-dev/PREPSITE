import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { billing, getPaidPlan } from "@/config/plans";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth/session";
import { usageSummary } from "@/server/billing/entitlement";
import { ensureReferralCode } from "@/server/billing/referral";
import { formatMoney } from "@/server/payments/notify";
import { Container, PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CopyLink } from "@/components/billing/copy-link";

export async function generateMetadata() {
  const t = await getTranslations("billing.page");
  return { title: t("title"), robots: { index: false } };
}

export default async function BillingPage() {
  const user = await requireUser("/billing");
  const t = await getTranslations("billing");
  const format = await getFormatter();
  const locale = await getLocale();
  const [{ ent, questionsLeft, testsLeft }, orders, code, referred] = await Promise.all([
    usageSummary(user.id),
    db.order.findMany({ where: { userId: user.id, status: { not: "CREATED" } }, orderBy: { createdAt: "desc" }, take: 50 }),
    ensureReferralCode(user.id),
    db.user.count({ where: { referredById: user.id } }),
  ]);
  const renewPlan = ent.planId && getPaidPlan(ent.planId) ? ent.planId : "quarter";
  const link = `${env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/?ref=${code}`;
  const date = (d: Date) => format.dateTime(d, { dateStyle: "long" });

  return (
    <Container className="max-w-4xl space-y-6">
      <PageHeader title={t("page.title")} />
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <Badge variant={ent.premium ? "default" : "secondary"}>{t(`state.${ent.state}`)}</Badge>
          </CardTitle>
          {ent.endsAt && (
            <CardDescription>{ent.state === "expired" || ent.state === "grace" ? t("page.endedAt", { date: date(ent.endsAt) }) : t("page.endsAt", { date: date(ent.endsAt) })}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {!ent.premium && questionsLeft !== null && <p className="text-sm">{t("page.freeUsage", { questions: questionsLeft, tests: testsLeft ?? 0 })}</p>}
          <div className="flex flex-wrap gap-2">
            {ent.state !== "none" && (
              <Button asChild>
                <Link href={`/checkout?plan=${renewPlan}`}>{t("page.renew", { plan: t(`plans.${renewPlan as "monthly"}.name`) })}</Link>
              </Button>
            )}
            <Button asChild variant={ent.state === "none" ? "default" : "outline"}>
              <Link href="/pricing">{t("page.upgrade")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("page.referralTitle")}</CardTitle>
          <CardDescription>{t("page.referralBody", { percent: billing.referral.friendDiscountPercent, days: billing.referral.referrerBonusDays })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <CopyLink value={link} />
          <p className="text-sm text-muted-foreground">{t("page.referred", { count: referred })}</p>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("page.orders")}</h2>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">{t("page.noOrders")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("receipt.number")}</TableHead>
                <TableHead>{t("receipt.plan")}</TableHead>
                <TableHead>{t("receipt.amount")}</TableHead>
                <TableHead>{t("receipt.status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">
                    {o.number}
                    <span className="block text-xs text-muted-foreground">{format.dateTime(o.createdAt, { dateStyle: "medium" })}</span>
                  </TableCell>
                  <TableCell>{t(`plans.${o.planId as "monthly"}.name`)}</TableCell>
                  <TableCell className="tabular-nums">{formatMoney(o.amount, o.currency as "UZS", locale)}</TableCell>
                  <TableCell>{t(`status.${o.status}`)}</TableCell>
                  <TableCell>
                    {(o.status === "PAID" || o.status === "REFUNDED") && (
                      <Link href={`/billing/receipts/${o.id}`} className="underline">
                        {t("page.receipt")}
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </Container>
  );
}
