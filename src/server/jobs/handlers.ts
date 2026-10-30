import "server-only";
import { finalizeBatch, prepareBatch, processPage } from "@/server/import/pdf-pipeline";
import { runDraftBatch } from "@/server/ai/draft-questions";
import { runBillingDaily } from "@/server/billing/daily";
import { runCalibration } from "@/server/analytics/calibration";
import { announceNewTest, sendEveningReminders } from "@/server/notify/jobs";
import { JOBS, registerHandler } from "./queue";

registerHandler(JOBS.pdfPrepare, async (data) => prepareBatch(String(data.batchId)));
registerHandler(JOBS.pdfPage, async (data, ctx) => processPage(String(data.pageId), ctx));
registerHandler(JOBS.pdfFinalize, async (data) => finalizeBatch(String(data.batchId)));
registerHandler(JOBS.aiDraft, async (data) => runDraftBatch(String(data.batchId)));
// The daily job also recalibrates questions from student answers.
registerHandler(JOBS.billingDaily, async () => {
  await runBillingDaily();
  await runCalibration();
});
registerHandler(JOBS.eveningReminders, async () => {
  await sendEveningReminders();
});
registerHandler(JOBS.announceTest, async (data) => {
  await announceNewTest(String(data.mockTestId));
});
