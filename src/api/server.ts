import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { DirectPlatform } from '../context/direct-platform';
import { SourceConnectorType } from '../connectors/types';

export function startApiServer(port = 4300) {
  const platform = new DirectPlatform();

  const server = createServer(async (req, res) => {
    try {
      await routeRequest(platform, req, res);
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'internal_error'
      });
    }
  });

  server.listen(port);
  return server;
}

async function routeRequest(platform: DirectPlatform, req: IncomingMessage, res: ServerResponse) {
  if (!req.url || !req.method) {
    return sendJson(res, 400, { error: 'invalid_request' });
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const method = req.method.toUpperCase();

  if (method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok', service: 'direct-context-platform' });
  }

  const registerMatch = path.match(/^\/api\/tenants\/([^/]+)\/connectors\/register$/);
  if (method === 'POST' && registerMatch) {
    const tenantId = decodeURIComponent(registerMatch[1]);
    const body = await readJson(req);
    const connectorType = String(body.connectorType ?? '') as SourceConnectorType;
    const response = await platform.registerConnector(tenantId, connectorType, body);
    return sendJson(res, 201, response);
  }

  const syncMatch = path.match(/^\/api\/tenants\/([^/]+)\/sync\/([^/]+)$/);
  if (method === 'POST' && syncMatch) {
    const tenantId = decodeURIComponent(syncMatch[1]);
    const connectorType = decodeURIComponent(syncMatch[2]) as SourceConnectorType;
    const body = await readJson(req);
    const response = await platform.syncConnector(tenantId, connectorType, body);
    return sendJson(res, 200, response);
  }

  const connectorsMatch = path.match(/^\/api\/tenants\/([^/]+)\/connectors$/);
  if (method === 'GET' && connectorsMatch) {
    const tenantId = decodeURIComponent(connectorsMatch[1]);
    const response = await platform.listConnectors(tenantId);
    return sendJson(res, 200, response);
  }

  const summaryMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/summary$/);
  if (method === 'GET' && summaryMatch) {
    const tenantId = decodeURIComponent(summaryMatch[1]);
    const response = await platform.getSummary(tenantId);
    return sendJson(res, 200, response);
  }

  const suggestionsMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/suggestions$/);
  if (method === 'GET' && suggestionsMatch) {
    const tenantId = decodeURIComponent(suggestionsMatch[1]);
    const response = await platform.getSuggestions(tenantId);
    return sendJson(res, 200, response);
  }

  const industryMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/industry$/);
  if (method === 'GET' && industryMatch) {
    const tenantId = decodeURIComponent(industryMatch[1]);
    const response = await platform.getIndustryProfile(tenantId);
    return sendJson(res, 200, response);
  }

  const readinessMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/readiness$/);
  if (method === 'GET' && readinessMatch) {
    const tenantId = decodeURIComponent(readinessMatch[1]);
    const response = await platform.getDataReadiness(tenantId);
    return sendJson(res, 200, response);
  }

  const executionPlanMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/execution-plan$/);
  if (method === 'GET' && executionPlanMatch) {
    const tenantId = decodeURIComponent(executionPlanMatch[1]);
    const response = await platform.getExecutionPlan(tenantId);
    return sendJson(res, 200, response);
  }

  const usageMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/usage$/);
  if (method === 'GET' && usageMatch) {
    const tenantId = decodeURIComponent(usageMatch[1]);
    const response = await platform.getUsageSummary(tenantId);
    return sendJson(res, 200, response);
  }

  const connectorRecommendationsMatch = path.match(/^\/api\/tenants\/([^/]+)\/connectors\/recommendations$/);
  if (method === 'GET' && connectorRecommendationsMatch) {
    const tenantId = decodeURIComponent(connectorRecommendationsMatch[1]);
    const response = await platform.getIndustryProfile(tenantId);
    return sendJson(res, 200, response.recommendedConnectors);
  }

  const askMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/ask$/);
  if (method === 'POST' && askMatch) {
    const tenantId = decodeURIComponent(askMatch[1]);
    const body = await readJson(req);
    const response = await platform.askWithContext(tenantId, String(body.question ?? ''), {
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      module: typeof body.module === 'string' ? body.module : undefined
    });
    return sendJson(res, 200, response);
  }

  const feedbackMatch = path.match(/^\/api\/tenants\/([^/]+)\/context\/feedback$/);
  if (method === 'POST' && feedbackMatch) {
    const tenantId = decodeURIComponent(feedbackMatch[1]);
    const body = await readJson(req);
    const response = await platform.recordFeedback(tenantId, {
      question: String(body.question ?? ''),
      answer: String(body.answer ?? ''),
      helpful: Boolean(body.helpful),
      notes: typeof body.notes === 'string' ? body.notes : undefined
    });
    return sendJson(res, 201, response);
  }

  const learningMatch = path.match(/^\/api\/tenants\/([^/]+)\/ml\/snapshot$/);
  if (method === 'GET' && learningMatch) {
    const tenantId = decodeURIComponent(learningMatch[1]);
    const response = await platform.getLearningSnapshot(tenantId);
    return sendJson(res, 200, response);
  }

  const knowledgeStatsMatch = path.match(/^\/api\/tenants\/([^/]+)\/knowledge\/stats$/);
  if (method === 'GET' && knowledgeStatsMatch) {
    const tenantId = decodeURIComponent(knowledgeStatsMatch[1]);
    const response = await platform.getKnowledgeStats(tenantId);
    return sendJson(res, 200, response);
  }

  const knowledgeSearchMatch = path.match(/^\/api\/tenants\/([^/]+)\/knowledge\/search$/);
  if (method === 'POST' && knowledgeSearchMatch) {
    const tenantId = decodeURIComponent(knowledgeSearchMatch[1]);
    const body = await readJson(req);
    const response = await platform.searchKnowledge(
      tenantId,
      String(body.query ?? ''),
      Math.max(1, Number(body.topK ?? 6))
    );
    return sendJson(res, 200, response);
  }

  return sendJson(res, 404, { error: 'not_found' });
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}
