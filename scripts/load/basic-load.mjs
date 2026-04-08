import { performance } from "node:perf_hooks";

const target = process.argv[2] ?? "http://localhost:3000/health";
const requests = Number(process.argv[3] ?? 100);
const concurrency = Number(process.argv[4] ?? 10);

if (!Number.isFinite(requests) || requests < 1) {
  throw new Error("requests must be >= 1");
}

if (!Number.isFinite(concurrency) || concurrency < 1) {
  throw new Error("concurrency must be >= 1");
}

const startedAt = performance.now();
let issued = 0;
let succeeded = 0;
let failed = 0;
const latencies = [];

const workers = Array.from({ length: concurrency }, async () => {
  while (true) {
    if (issued >= requests) return;
    issued += 1;

    const requestStart = performance.now();
    try {
      const response = await fetch(target);
      if (!response.ok) {
        failed += 1;
      } else {
        succeeded += 1;
      }
    } catch {
      failed += 1;
    } finally {
      const elapsed = performance.now() - requestStart;
      latencies.push(elapsed);
    }
  }
});

await Promise.all(workers);

const durationMs = performance.now() - startedAt;
latencies.sort((a, b) => a - b);

const p50 = percentile(latencies, 0.5);
const p95 = percentile(latencies, 0.95);
const p99 = percentile(latencies, 0.99);

console.log(
  JSON.stringify(
    {
      target,
      requests,
      concurrency,
      success: succeeded,
      failed,
      durationMs: Number(durationMs.toFixed(2)),
      rps: Number((requests / (durationMs / 1000)).toFixed(2)),
      latencyMs: {
        p50: Number(p50.toFixed(2)),
        p95: Number(p95.toFixed(2)),
        p99: Number(p99.toFixed(2))
      }
    },
    null,
    2
  )
);

function percentile(samples, p) {
  if (samples.length === 0) return 0;
  const index = Math.min(samples.length - 1, Math.floor(samples.length * p));
  return samples[index];
}
