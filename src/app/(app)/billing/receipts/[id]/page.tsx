import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import siteConfig from "@site";
import { db } from "@/lib/db";
import { isOwner, requireUser } from "@/server/auth/session";
import { formatMoney } from "@/server/payments/notify";
import { Container } from "@/components/layout/page-header";
import { PrintButton } from "@/components/billing/print-button";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/billing/receipts/${id}`);
  const order = await db.order.findUnique({ where: { id }, include: { user: { select: { name: true, email: true } }, subscription: true } });
  if (!order || (order.userId !== user.id && !isOwner(user)) || (order.status !== "PAID" && order.status !== "REFUNDED")) notFound();
  const t = await getTranslations("billing");
  const format = await getFormatter();
  const locale = await getLocale();
  const cur = order.currency as "UZS";
  const rows: [string, string][] = [
    [t("receipt.number"), String(order.number)],
    [t("receipt.customer"), order.user.name ?? order.user.email ?? "—"],
    [t("receipt.plan"), t(`plans.${order.planId as "monthly"}.name`)],
    [t("receipt.list"), formatMoney(order.listAmount, cur, locale)],
    ...(order.discountAmount ? ([[t("receipt.discount"), `−${formatMoney(order.discountAmount, cur, locale)}`]] as [string, string][]) : []),
    [t("receipt.amount"), formatMoney(order.amount, cur, locale)],
    [t("receipt.provider"), t(`providers.${order.provider as "payme"}`)],
    [t("receipt.paidAt"), order.paidAt ? format.dateTime(order.paidAt, { dateStyle: "long", timeStyle: "short" }) : "—"],
    ...(order.subscription ? ([[t("receipt.validUntil"), format.dateTime(order.subscription.endsAt, { dateStyle: "long" })]] as [string, string][]) : []),
    [t("receipt.status"), t(`status.${order.status}`)],
  ];
  return (
    <Container className="max-w-xl">
      <article className="space-y-6 rounded-lg border p-8 print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("receipt.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("receipt.seller")}: {siteConfig.legalName}, {siteConfig.contact.address}
            </p>
          </div>
          <PrintButton label={t("receipt.print")} />
        </header>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">{t("receipt.note", { legalName: siteConfig.legalName })}</p>
      </article>
    </Container>
  );
}
