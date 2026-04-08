export function estimateTokens(text: string) {
  const words = text.trim().split(/\s+/g).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

export function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function chunkByParagraphs(text: string, minTokens = 250, maxTokens = 700) {
  const paragraphs = text
    .split(/\n{2,}/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (estimateTokens(candidate) <= maxTokens) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);
    current = paragraph;
  }

  if (current) chunks.push(current);
  return chunks.map((chunk, index, list) => {
    if (estimateTokens(chunk) >= minTokens || index === 0 || index === list.length - 1) {
      return chunk;
    }
    return `${list[index - 1]}\n\n${chunk}`;
  });
}

export function cosineSimilarity(a: number[], b: number[]) {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
