import type { DocumentMetadata } from './types';
import { extractKeywords, normalizeForMatch } from '../utils/text';

type DocumentForSimilarity = {
  id: string;
  dominio: string;
  idioma: string;
  text: string;
  metadata: DocumentMetadata;
};

export function markSimilarDocuments(
  documents: DocumentForSimilarity[],
  threshold: number
): Record<string, string[]> {
  const vectors = new Map<string, Map<string, number>>();
  const norms = new Map<string, number>();
  const index = new Map<string, Set<string>>();
  const result: Record<string, Set<string>> = {};

  for (const doc of documents) {
    const vector = termVector(doc.text);
    vectors.set(doc.id, vector);
    norms.set(doc.id, vectorNorm(vector));
    result[doc.id] = new Set<string>();

    for (const term of extractKeywords(doc.text, 20)) {
      if (!index.has(term)) index.set(term, new Set());
      index.get(term)!.add(doc.id);
    }
  }

  for (const doc of documents) {
    const candidates = new Set<string>();
    const docTerms = extractKeywords(doc.text, 20);

    for (const term of docTerms) {
      const ids = index.get(term);
      if (!ids) continue;
      for (const candidateId of ids) {
        if (candidateId === doc.id) continue;
        candidates.add(candidateId);
      }
    }

    for (const candidateId of candidates) {
      if (candidateId < doc.id) continue;

      const candidate = documents.find((entry) => entry.id === candidateId);
      if (!candidate) continue;

      if (candidate.dominio !== doc.dominio) continue;
      if (candidate.idioma !== doc.idioma) continue;

      const similarity = cosine(
        vectors.get(doc.id)!,
        vectors.get(candidateId)!,
        norms.get(doc.id)!,
        norms.get(candidateId)!
      );

      if (similarity >= threshold) {
        result[doc.id].add(candidateId);
        result[candidateId].add(doc.id);
      }
    }
  }

  return Object.fromEntries(
    Object.entries(result).map(([id, ids]) => [id, [...ids]])
  );
}

function termVector(text: string) {
  const normalized = normalizeForMatch(text);
  const tokens = normalized
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/g)
    .filter((token) => token.length > 3)
    .slice(0, 12000);

  const map = new Map<string, number>();
  for (const token of tokens) {
    map.set(token, (map.get(token) ?? 0) + 1);
  }
  return map;
}

function vectorNorm(vector: Map<string, number>) {
  let total = 0;
  for (const value of vector.values()) total += value * value;
  return Math.sqrt(total);
}

function cosine(a: Map<string, number>, b: Map<string, number>, normA: number, normB: number) {
  if (normA === 0 || normB === 0) return 0;
  let dot = 0;

  const [smaller, larger] = a.size < b.size ? [a, b] : [b, a];
  for (const [term, value] of smaller.entries()) {
    dot += value * (larger.get(term) ?? 0);
  }
  return dot / (normA * normB);
}
