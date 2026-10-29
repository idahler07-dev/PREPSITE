import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth/session";
import { Container, PageHeader } from "@/components/layout/page-header";
import { PaymentStatus } from "@/components/billing/payment-status";

export async function generateMetadata() {
  const t = await getTranslations("billing.return");
  return { title: t("title"), robots: { index: false } };
}

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  await requireUser(`/payments/return?order=${order ?? ""}`);
  const t = await getTranslations("billing.return");
  return (
    <Container className="max-w-xl">
      <PageHeader title={t("title")} />
      {order ? <PaymentStatus orderId={order} /> : null}
    </Container>
  );
}
