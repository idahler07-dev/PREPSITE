import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/server/auth/session";
import { getRunnerState } from "@/server/attempts/service";
import { loadAnnotations } from "@/server/attempts/annotations";
import { HttpError } from "@/server/http";
import { TestRunner } from "@/components/test/test-runner";
import { BreakScreen } from "@/components/test/break-screen";
import { aiAvailable } from "@/server/ai/client";

/** Desmos's public demo key from https://www.desmos.com/api — for development only. */
const DESMOS_DEMO_KEY = "dcb31709b452b1cf9dc26972add0fda6";

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
  // Desmos API keys are meant to be used in the browser; Desmos limits each key to our domain.
  // Without a key, development falls back to Desmos's documented demo key (with a console warning).
  const ownKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY || process.env.DESMOS_API_KEY || null;
  const demo = !ownKey && process.env.NODE_ENV === "development";
  return (
    <TestRunner
      key={state.module.id}
      initial={state}
      annotations={await loadAnnotations(id, user.id)}
      desmosKey={ownKey ?? (demo ? DESMOS_DEMO_KEY : null)}
      desmosDemoKey={demo}
      aiEnabled={aiAvailable()}
    />
  );
}
