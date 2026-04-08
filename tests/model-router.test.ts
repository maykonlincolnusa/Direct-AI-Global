import test from 'node:test';
import assert from 'node:assert/strict';
import { AIModelRouter } from '../src/ai/model-router';

test('model router selects reasoning route for diagnostic healthcare questions', () => {
  const router = new AIModelRouter();
  const decision = router.decide({
    question: 'Diagnosticar porque a operacao da clinica perdeu eficiencia e qual plano priorizar',
    industry: 'healthcare',
    readinessScore: 32
  });

  assert.equal(decision.workflow, 'diagnosis');
  assert.equal(decision.modelClass, 'reasoning');
  assert.equal(decision.providerHint, 'openai');
  assert.equal(decision.maxContextTokens, 8000);
});

test('model router uses economy route for lightweight retail classification tasks', () => {
  const router = new AIModelRouter();
  const decision = router.decide({
    question: 'Classificar pedidos e tags do ecommerce por categoria de produto',
    industry: 'retail_ecommerce',
    readinessScore: 78,
    shortResponse: true
  });

  assert.equal(decision.workflow, 'classification');
  assert.equal(decision.modelClass, 'economy');
  assert.equal(decision.providerHint, 'google');
  assert.equal(decision.responseMode, 'short');
});
