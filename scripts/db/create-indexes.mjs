import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/direct-core";
const dbPrefix = process.env.MONGO_DB_PREFIX ?? "direct";

const client = new MongoClient(mongoUri);

try {
  await client.connect();

  const coreDb = client.db(`${dbPrefix}-core`);
  const salesDb = client.db(`${dbPrefix}-sales`);
  const financeDb = client.db(`${dbPrefix}-finance`);
  const crmDb = client.db(`${dbPrefix}-crm`);
  const aiDb = client.db(`${dbPrefix}-ai`);

  await Promise.all([
    coreDb.collection("users").createIndex({ tenantId: 1, email: 1 }, { unique: true }),
    coreDb.collection("auditLogs").createIndex({ tenantId: 1, at: -1 }),
    salesDb.collection("leads").createIndex({ tenantId: 1, updatedAt: -1 }),
    salesDb.collection("opportunities").createIndex({ tenantId: 1, stage: 1 }),
    financeDb.collection("ledger").createIndex({ tenantId: 1, createdAt: -1 }),
    financeDb.collection("payments").createIndex({ tenantId: 1, status: 1, dueDate: 1 }),
    crmDb.collection("contacts").createIndex({ tenantId: 1, email: 1 }),
    crmDb.collection("contacts").createIndex({ tenantId: 1, tags: 1 }),
    aiDb.collection("tokenUsage").createIndex({ tenantId: 1, module: 1, createdAt: -1 }),
    aiDb.collection("tokenUsage").createIndex({ tenantId: 1, userId: 1, createdAt: -1 })
  ]);

  console.log("MongoDB indexes ensured for core, sales, finance, crm and ai databases.");
} finally {
  await client.close();
}
