import "server-only";
import { finalizeBatch, prepareBatch, processPage } from "@/server/import/pdf-pipeline";
import { JOBS, registerHandler } from "./queue";

registerHandler(JOBS.pdfPrepare, async (data) => prepareBatch(String(data.batchId)));
registerHandler(JOBS.pdfPage, async (data, ctx) => processPage(String(data.pageId), ctx));
registerHandler(JOBS.pdfFinalize, async (data) => finalizeBatch(String(data.batchId)));
