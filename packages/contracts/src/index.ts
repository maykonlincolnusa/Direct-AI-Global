import { z } from 'zod';

export const baseMetadataSchema = z.object({
  tenantId: z.string().uuid(),
  module: z.string(),
  initiatedBy: z.string().optional()
});

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  region: z.enum(['BR', 'LATAM', 'US', 'EU', 'APAC']),
  locale: z.string(),
  currency: z.string(),
  timezone: z.string(),
  plan: z.string(),
  modules: z.array(z.string())
});

export const leadSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string(),
  stage: z.enum(['new', 'contacted', 'proposal', 'won', 'lost']),
  score: z.number().min(0).max(100),
  ownerId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const opportunitySchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string(),
  value: z.number().min(0),
  probability: z.number().min(0).max(100),
  closeDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Must be date' }),
  pipelineStage: z.string()
});

export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  amount: z.number().min(0),
  currency: z.string(),
  dueDate: z.string(),
  status: z.enum(['issued', 'pending', 'paid', 'overdue'])
});

export const automationWorkflowSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string(),
  trigger: z.string(),
  actions: z.array(z.string()).min(1)
});

export const aiQuerySchema = z.object({
  moduleContext: z.string(),
  prompt: z.string().min(3),
  tokenBudget: z.number().int().min(1),
  includeHistory: z.boolean().default(true)
});
