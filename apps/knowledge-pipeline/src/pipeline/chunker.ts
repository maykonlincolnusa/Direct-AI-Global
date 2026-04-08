import { createHash } from 'node:crypto';
import type { ContentType, DocumentChunk, Domain } from './types';
import { estimateTokens, splitParagraphs, splitSentences } from '../utils/text';

export function chunkText(
  documentId: string,
  text: string,
  domain: Domain,
  type: ContentType,
  minTokens: number,
  maxTokens: number
) {
  const paragraphs = splitParagraphs(text);
  const chunks: DocumentChunk[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    if (paragraphTokens > maxTokens) {
      for (const sentenceChunk of splitLongParagraph(paragraph, maxTokens)) {
        pushOrMerge(sentenceChunk);
      }
      continue;
    }

    pushOrMerge(paragraph);
  }

  if (currentChunk.trim()) {
    chunks.push(toChunk(documentId, currentChunk.trim(), domain, type, chunks.length));
  }

  return chunks;

  function pushOrMerge(unit: string) {
    const nextCandidate = currentChunk ? `${currentChunk}\n\n${unit}` : unit;
    const candidateTokens = estimateTokens(nextCandidate);

    if (candidateTokens <= maxTokens) {
      currentChunk = nextCandidate;
      return;
    }

    if (currentChunk.trim()) {
      chunks.push(toChunk(documentId, currentChunk.trim(), domain, type, chunks.length));
    }
    currentChunk = unit;

    if (estimateTokens(currentChunk) < minTokens && chunks.length > 0) {
      const previous = chunks[chunks.length - 1];
      const merged = `${previous.texto}\n\n${currentChunk}`;
      if (estimateTokens(merged) <= maxTokens) {
        previous.texto = merged;
        currentChunk = '';
      }
    }
  }
}

function splitLongParagraph(paragraph: string, maxTokens: number) {
  const sentences = splitSentences(paragraph);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (estimateTokens(next) > maxTokens) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function toChunk(documentId: string, text: string, domain: Domain, type: ContentType, order: number): DocumentChunk {
  const hash = createHash('sha1').update(`${documentId}:${order}:${text.slice(0, 80)}`).digest('hex').slice(0, 16);
  return {
    chunk_id: `${documentId}-${hash}`,
    document_id: documentId,
    texto: text,
    dominio: domain,
    tipo: type,
    ordem: order
  };
}
