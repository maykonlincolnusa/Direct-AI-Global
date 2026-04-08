import type { DocumentMetadata } from './types';

export function buildTaxonomy(metadataList: DocumentMetadata[]) {
  const byDomain = countBy(metadataList.map((entry) => entry.dominio));
  const byType = countBy(metadataList.map((entry) => entry.tipo));
  const byLanguage = countBy(metadataList.map((entry) => entry.idioma));
  const byAuthor = countBy(metadataList.map((entry) => entry.autor));
  const keywordFrequency = countBy(metadataList.flatMap((entry) => entry.palavras_chave));

  return {
    generated_at: new Date().toISOString(),
    summary: {
      documents: metadataList.length,
      domains: Object.keys(byDomain).length,
      types: Object.keys(byType).length,
      languages: Object.keys(byLanguage).length
    },
    dimensions: {
      dominio: byDomain,
      tipo: byType,
      idioma: byLanguage,
      autor: byAuthor
    },
    top_keywords: Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100)
      .map(([term, count]) => ({ term, count }))
  };
}

function countBy(values: string[]) {
  const counter: Record<string, number> = {};
  for (const value of values) {
    const key = value || 'unknown';
    counter[key] = (counter[key] ?? 0) + 1;
  }
  return counter;
}
