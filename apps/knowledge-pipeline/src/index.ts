import { KnowledgeIngestionPipeline } from './pipeline/KnowledgeIngestionPipeline';

async function main() {
  const pipeline = new KnowledgeIngestionPipeline();
  const report = await pipeline.run();
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error('Knowledge ingestion failed:', error);
  process.exit(1);
});
