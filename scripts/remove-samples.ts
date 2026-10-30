/**
 * Remove every development sample question (isSample = true) before launch.
 * Practice attempts that used them are deleted too, since their results
 * would point at questions that no longer exist.
 *
 *   pnpm samples:remove            delete
 *   pnpm samples:remove --dry-run  only report what would be deleted
 */
import { scriptClient } from "./db";

const db = scriptClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const samples = await db.question.findMany({ where: { isSample: true }, select: { id: true } });
  const ids = samples.map((s) => s.id);
  const attempts = await db.attempt.findMany({
    where: { modules: { some: { responses: { some: { questionId: { in: ids } } } } } },
    select: { id: true },
  });
  console.log(`Sample questions: ${ids.length}`);
  console.log(`Practice attempts that used them: ${attempts.length}`);
  if (dryRun) {
    console.log("Dry run — nothing deleted.");
    return;
  }
  if (ids.length === 0) {
    console.log("Nothing to remove.");
    return;
  }
  await db.$transaction([
    db.attempt.deleteMany({ where: { id: { in: attempts.map((a) => a.id) } } }),
    // Any response left elsewhere (should be none) would block deletion.
    db.response.deleteMany({ where: { questionId: { in: ids } } }),
    db.question.deleteMany({ where: { id: { in: ids } } }),
    db.auditLog.create({ data: { action: "samples.remove", entity: "Question", data: { questions: ids.length, attempts: attempts.length } } }),
  ]);
  console.log(`Removed ${ids.length} sample questions and ${attempts.length} attempts.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
