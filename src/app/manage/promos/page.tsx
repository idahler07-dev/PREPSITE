import { getFormatter, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { requireOwner } from "@/server/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NewPromoForm, PromoToggle } from "@/components/admin/billing-forms";

export default async function AdminPromosPage() {
  await requireOwner();
  const t = await getTranslations("admin.promos");
  const tb = await getTranslations("billing");
  const format = await getFormatter();
  const promos = await db.promoCode.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: { where: { status: "PAID" } } } } } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewPromoForm />
        </CardContent>
      </Card>
      {promos.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("discount")}</TableHead>
              <TableHead>{t("plans")}</TableHead>
              <TableHead>{t("used")}</TableHead>
              <TableHead>{t("validUntil")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.map((p) => {
              const amount = p.amountOff as { UZS?: number; USD?: number } | null;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">
                    {p.code} {!p.active && <Badge variant="secondary">{t("inactive")}</Badge>}
                    {p.note && <span className="block text-xs text-muted-foreground">{p.note}</span>}
                  </TableCell>
                  <TableCell>{p.percentOff ? `${p.percentOff}%` : [amount?.UZS ? `${format.number(amount.UZS)} so'm` : null, amount?.USD ? `$${amount.USD}` : null].filter(Boolean).join(" / ")}</TableCell>
                  <TableCell>{p.planIds.length ? p.planIds.map((id) => tb(`plans.${id as "monthly"}.name`)).join(", ") : t("allPlans")}</TableCell>
                  <TableCell className="tabular-nums">
                    {p._count.orders}
                    {p.maxRedemptions !== null && ` / ${p.maxRedemptions}`}
                  </TableCell>
                  <TableCell>{p.validUntil ? format.dateTime(p.validUntil, { dateStyle: "medium" }) : "—"}</TableCell>
                  <TableCell>
                    <PromoToggle id={p.id} active={p.active} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
