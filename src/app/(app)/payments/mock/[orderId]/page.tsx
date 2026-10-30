import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireUser } from "@/server/auth/session";
import { formatMoney } from "@/server/payments/notify";
import { mockProvider } from "@/server/payments/providers/mock";
import { Container, PageHeader } from "@/components/layout/page-header";
import { MockCheckoutButtons } from "@/components/billing/mock-checkout";

/** Stand-in for a provider's hosted checkout (development and tests only). */
export default async function MockCheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await requireUser(`/payments/mock/${orderId}`);
  if (!mockProvider.configured()) notFound();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== user.id || order.provider !== "mock") notFound();
  const t = await getTranslations("billing");
  const locale = await getLocale();
  return (
    <Container className="max-w-md">
      <PageHeader title={t("mock.title")} description={t("mock.notice")} />
      <div className="space-y-4 rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">{t("mock.order", { number: order.number })}</p>
        <p className="text-sm">{t(`plans.${order.planId as "monthly"}.name`)}</p>
        <p className="text-3xl font-bold">{formatMoney(order.amount, order.currency as "UZS", locale)}</p>
        <MockCheckoutButtons orderId={order.id} disabled={order.status !== "CREATED" && order.status !== "PENDING"} />
      </div>
    </Container>
  );
}
