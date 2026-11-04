/**
 * Run a command, trying again if it fails: `node scripts/retry.mjs <tries> <seconds between> <command...>`.
 * The deploy build uses it for the database steps, so a database that is waking up
 * (Neon's "Can't reach database server") doesn't fail the whole deploy.
 */
import { spawnSync } from "node:child_process";

const [triesArg, waitArg, ...cmd] = process.argv.slice(2);
const tries = Number(triesArg);
const wait = Number(waitArg);
if (!tries || Number.isNaN(wait) || !cmd.length) {
  console.error("usage: node scripts/retry.mjs <tries> <seconds> <command...>");
  process.exit(2);
}
for (let attempt = 1; attempt <= tries; attempt++) {
  const r = spawnSync(cmd.join(" "), { stdio: "inherit", shell: true });
  if (r.status === 0) process.exit(0);
  if (attempt === tries) process.exit(r.status ?? 1);
  console.error(`\n[retry] "${cmd.join(" ")}" failed (attempt ${attempt} of ${tries}); trying again in ${wait}s\n`);
  await new Promise((resolve) => setTimeout(resolve, wait * 1000));
}
