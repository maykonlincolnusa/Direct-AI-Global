import { hashString } from '../utils/id';
import { normalizeText } from '../utils/text';

export interface ParsedWebsitePage {
  url: string;
  title: string;
  description: string;
  headings: string[];
  ctas: string[];
  navigation: string[];
  socialProofSignals: string[];
  keywords: string[];
  tone: string;
  positioningSignals: string[];
  content: string;
  seo: {
    canonical?: string;
    robots?: string;
  };
}

const CTA_TERMS = ['fale', 'contato', 'compre', 'agende', 'solicite', 'demo', 'buy', 'contact', 'book', 'start'];
const POSITIONING_TERMS = ['premium', 'especialista', 'líder', 'lider', 'inovação', 'innovative', 'trusted', 'top'];
const SOCIAL_PROOF_TERMS = ['depoimento', 'testemunho', 'clientes', 'cases', 'reviews', 'avaliações', 'avaliacoes'];

export function parseWebsitePage(url: string, html: string): ParsedWebsitePage {
  const cleanHtml = normalizeText(html);
  const title = extractFirst(cleanHtml, /<title[^>]*>(.*?)<\/title>/i);
  const description = extractMeta(cleanHtml, 'description');
  const headings = extractAll(cleanHtml, /<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi);
  const textContent = stripHtml(cleanHtml);
  const links = extractAll(cleanHtml, /<a[^>]*>(.*?)<\/a>/gi);
  const buttons = extractAll(cleanHtml, /<button[^>]*>(.*?)<\/button>/gi);
  const ctaCandidates = [...links, ...buttons];
  const ctas = unique(
    ctaCandidates.filter((entry) =>
      CTA_TERMS.some((term) => normalizeText(entry).toLowerCase().includes(term))
    )
  ).slice(0, 30);
  const navigation = extractNavigation(cleanHtml);
  const socialProofSignals = SOCIAL_PROOF_TERMS.filter((term) =>
    normalizeText(textContent).toLowerCase().includes(term)
  );
  const keywords = extractKeywords(description, headings, textContent);
  const tone = detectTone(textContent);
  const positioningSignals = POSITIONING_TERMS.filter((term) =>
    normalizeText(textContent).toLowerCase().includes(term)
  );

  return {
    url,
    title,
    description,
    headings,
    ctas,
    navigation,
    socialProofSignals,
    keywords,
    tone,
    positioningSignals,
    content: textContent.slice(0, 30000),
    seo: {
      canonical: extractLinkRel(cleanHtml, 'canonical'),
      robots: extractMeta(cleanHtml, 'robots')
    }
  };
}

export function detectWebsitePagesFromSitemap(xml: string, maxPages = 20) {
  const urls = extractAll(xml, /<loc>(.*?)<\/loc>/gi)
    .map((entry) => entry.trim())
    .filter(Boolean);
  return unique(urls).slice(0, maxPages);
}

export function pageChecksum(page: ParsedWebsitePage) {
  return hashString(`${page.url}:${page.title}:${page.description}:${page.content.slice(0, 800)}`);
}

function extractMeta(html: string, name: string) {
  const expression = new RegExp(
    `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`,
    'i'
  );
  return extractFirst(html, expression);
}

function extractLinkRel(html: string, rel: string) {
  const expression = new RegExp(
    `<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']*)["'][^>]*>`,
    'i'
  );
  return extractFirst(html, expression);
}

function extractNavigation(html: string) {
  const navBlocks = extractAll(html, /<nav[^>]*>([\s\S]*?)<\/nav>/gi);
  const links = navBlocks.flatMap((block) => extractAll(block, /<a[^>]*>(.*?)<\/a>/gi));
  return unique(links).slice(0, 40);
}

function extractKeywords(description: string, headings: string[], content: string) {
  const base = `${description}\n${headings.join('\n')}\n${content}`
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/g)
    .filter((word) => word.length > 4);

  const frequencies = new Map<string, number>();
  for (const word of base) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }
  return [...frequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([word]) => word);
}

function detectTone(content: string) {
  const text = content.toLowerCase();
  const formal = ['solução', 'excelência', 'transformação', 'estratégia', 'especialista'];
  const informal = ['você', 'vamos', 'agora', 'rápido', 'simples'];
  const formalScore = formal.reduce((sum, term) => sum + Number(text.includes(term)), 0);
  const informalScore = informal.reduce((sum, term) => sum + Number(text.includes(term)), 0);
  if (formalScore > informalScore + 1) return 'formal';
  if (informalScore > formalScore + 1) return 'conversational';
  return 'neutral';
}

function stripHtml(html: string) {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function extractFirst(text: string, regex: RegExp) {
  const match = regex.exec(text);
  return match?.[1] ? normalizeText(match[1]) : '';
}

function extractAll(text: string, regex: RegExp) {
  const values: string[] = [];
  let match = regex.exec(text);
  while (match) {
    if (match[1]) values.push(normalizeText(match[1]));
    match = regex.exec(text);
  }
  return values.filter(Boolean);
}

function unique(values: string[]) {
  return [...new Set(values)];
}
