import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/server/auth/session";
import { getRunnerState } from "@/server/attempts/service";
import { loadAnnotations } from "@/server/attempts/annotations";
import { HttpError } from "@/server/http";
import { TestRunner } from "@/components/test/test-runner";
import { BreakScreen } from "@/components/test/break-screen";

export async function generateMetadata() {
  const t = await getTranslations("test");
  return { title: t("drillTitle"), robots: { index: false } };
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/test/${id}`);
  let state;
  try {
    state = await getRunnerState(id, user.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  if ("completed" in state) return redirect({ href: `/attempts/${id}`, locale: await getLocale() });
  if ("onBreak" in state) return <BreakScreen key={state.breakEndsAt} state={state} />;
  // Desmos API keys are meant to be used in the browser; the key is limited to our domain by Desmos.
  return <TestRunner key={state.module.id} initial={state} annotations={await loadAnnotations(id, user.id)} desmosKey={process.env.DESMOS_API_KEY || null} />;
}
