const SENTENCE_BREAK = /(?<=[.!?])\s+/;

export function sanitizeText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function splitSentences(text: string) {
  return text
    .split(SENTENCE_BREAK)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function estimateTokens(text: string) {
  const words = text.trim().split(/\s+/g).filter(Boolean).length;
  return Math.ceil(words * 1.35);
}

export function inferTitle(text: string) {
  const paragraphs = splitParagraphs(text).slice(0, 8);
  for (const paragraph of paragraphs) {
    const heading = paragraph.replace(/^#+\s*/, '').trim();
    if (heading.length >= 20 && heading.length <= 120) {
      return heading;
    }
  }
  return paragraphs[0]?.slice(0, 80) ?? 'Documento sem titulo';
}

export function summarizeText(text: string, maxChars = 520) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return '';
  let summary = '';
  for (const sentence of sentences) {
    if ((summary + sentence).length > maxChars) break;
    summary = `${summary}${summary ? ' ' : ''}${sentence}`;
  }
  return summary || sentences[0].slice(0, maxChars);
}

export function textQualityScore(text: string) {
  const words = text.toLowerCase().split(/\s+/g).filter(Boolean);
  if (words.length === 0) return 0;
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;
  const paragraphCount = splitParagraphs(text).length;
  const lengthScore = Math.min(4, words.length / 900);
  const structureScore = Math.min(3, paragraphCount / 8);
  const varietyScore = Math.min(3, uniqueRatio * 5);
  return Number((lengthScore + structureScore + varietyScore).toFixed(2));
}

const STOP_WORDS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'a',
  'o',
  'e',
  'em',
  'para',
  'por',
  'com',
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'una',
  'uno',
  'para',
  'con',
  'del',
  'los',
  'las',
  'que',
  'como',
  'mais',
  'mais',
  'sobre',
  'entre'
]);

export function extractKeywords(text: string, limit = 12) {
  const frequencies = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/g)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));

  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function normalizeForMatch(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
