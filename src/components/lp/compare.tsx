import { getTranslations } from "next-intl/server";

/** Prep book vs tutor vs WilloPrep. Plain table, our column tinted. */
export async function LpCompare({ price }: { price: string }) {
  const t = await getTranslations("lp");
  const cols = t.raw("compare.cols") as string[];
  const rows = t.raw("compare.rows") as string[][];
  return (
    <section className="mx-auto w-full max-w-[920px] min-w-0 px-4 pt-16 sm:px-8">
      <h2 className="text-xl font-black tracking-[-0.03em]">
        {t("compare.title")}
      </h2>
      <div className="mt-4 overflow-x-auto rounded-3xl border bg-surface">
        <table className="w-full min-w-[620px] text-start text-sm">
          <thead>
            <tr className="bg-surface-2/60 text-[13px] font-bold text-muted-foreground">
              <td className="px-5 py-3.5" />
              {cols.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-5 py-3.5 text-start font-bold ${i === 2 ? "bg-[#F0F6F7] text-primary" : ""}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-t">
                <th
                  scope="row"
                  className="px-5 py-3.5 text-start font-extrabold"
                >
                  {r[0]}
                </th>
                <td className="px-5 py-3.5 text-muted-foreground">{r[1]}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{r[2]}</td>
                <td className="bg-[#F0F6F7] px-5 py-3.5 font-extrabold">
                  {r[3]!.replace("{price}", price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
