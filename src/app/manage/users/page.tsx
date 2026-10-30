import { getFormatter, getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { isOwner, requireOwner } from "@/server/auth/session";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { UserSearch } from "@/components/admin/user-search";

const PAGE = 50;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireOwner();
  const t = await getTranslations("admin.users");
  const format = await getFormatter();
  const sp = await searchParams;
  const q = sp.q?.trim().slice(0, 100);
  const page = z.coerce.number().int().min(1).catch(1).parse(sp.page);
  const where = q ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] } : {};
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: { id: true, name: true, email: true, telegramUsername: true, emailVerified: true, createdAt: true, _count: { select: { attempts: true } } },
    }),
  ]);
  return (
    <div>
      <PageHeader title={t("title")} description={t("ownerNote")} />
      <UserSearch initial={q ?? ""} />
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("columns.name")}</TableHead>
              <TableHead>{t("columns.email")}</TableHead>
              <TableHead>{t("columns.access")}</TableHead>
              <TableHead>{t("columns.attempts")}</TableHead>
              <TableHead>{t("columns.joined")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name ?? (u.telegramUsername ? `@${u.telegramUsername}` : "—")}</TableCell>
                <TableCell className="text-sm">{u.email ?? "—"}</TableCell>
                <TableCell>
                  {isOwner(u) ? <Badge>{t("owner")}</Badge> : <span className="text-sm text-muted-foreground">{t("member")}</span>}
                </TableCell>
                <TableCell className="tabular-nums">{u._count.attempts}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format.dateTime(u.createdAt, { dateStyle: "medium" })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / PAGE))} total={total} pageSize={PAGE} />
    </div>
  );
}
