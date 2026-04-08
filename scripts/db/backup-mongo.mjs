import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/direct-core";
const outputRoot = process.env.MONGO_BACKUP_DIR ?? ".backups";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = resolve(outputRoot, timestamp);

await mkdir(outputDir, { recursive: true });

await run("mongodump", [`--uri=${mongoUri}`, `--out=${outputDir}`]);
console.log(`Backup completed at ${outputDir}`);

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: true
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise(undefined);
        return;
      }
      rejectPromise(new Error(`${command} failed with exit code ${code}`));
    });
  });
}
