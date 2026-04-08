import { franc } from 'franc';
import type { ContentType, Domain } from '../pipeline/types';
import { normalizeForMatch } from '../utils/text';

const DOMAIN_KEYWORDS: Record<Domain, string[]> = {
  marketing: [
    'marketing',
    'brand',
    'branding',
    'campanha',
    'campanha',
    'audiencia',
    'posicionamento',
    'funnel',
    'conteudo',
    'copywriting',
    'trafego',
    'publicidade'
  ],
  vendas: [
    'vendas',
    'venda',
    'lead',
    'pipeline',
    'proposta',
    'fechamento',
    'cliente',
    'negociacao',
    'objeção',
    'objecao',
    'forecast'
  ],
  financas: [
    'financeiro',
    'financas',
    'cashflow',
    'fluxo de caixa',
    'receita',
    'despesa',
    'margem',
    'valuation',
    'investimento',
    'lucro'
  ],
  gestao: [
    'gestao',
    'management',
    'operacao',
    'processo',
    'processos',
    'governanca',
    'estrutura',
    'organograma',
    'execucao'
  ],
  estrategia: [
    'estrategia',
    'strategy',
    'vantagem competitiva',
    'competicao',
    'modelo de negocio',
    'vision',
    'roadmap',
    'market fit'
  ],
  lideranca: [
    'lideranca',
    'leader',
    'lider',
    'cultura',
    'time',
    'coaching',
    'gestor',
    'delegacao',
    'ownership'
  ],
  produtividade: [
    'produtividade',
    'produtivo',
    'rotina',
    'prioridade',
    'foco',
    'tempo',
    'organização',
    'organizacao',
    'checklist'
  ],
  tecnologia: [
    'tecnologia',
    'software',
    'api',
    'arquitetura',
    'dados',
    'inteligencia artificial',
    'machine learning',
    'infraestrutura',
    'cloud'
  ],
  geral: []
};

const TYPE_KEYWORDS: Record<ContentType, string[]> = {
  teoria: ['teoria', 'conceito', 'fundamentos', 'princípios', 'principios'],
  pratica: ['passo a passo', 'como fazer', 'guia pratico', 'playbook', 'implementacao'],
  'estudo de caso': ['estudo de caso', 'case study', 'case', 'resultado'],
  carta: ['dear', 'caro', 'carta', 'letter to', 'atenciosamente'],
  artigo: ['artigo', 'article', 'publicado', 'coluna'],
  framework: ['framework', 'canvas', 'matriz', 'modelo', 'template']
};

const AUTHOR_PATTERNS: Array<{ author: string; patterns: RegExp[] }> = [
  { author: 'Warren Buffett', patterns: [/warren buffett/i] },
  { author: 'Charlie Munger', patterns: [/charlie munger/i] },
  { author: 'Seth Godin', patterns: [/seth godin/i] },
  { author: 'Philip Kotler', patterns: [/philip kotler/i] },
  { author: 'Peter Drucker', patterns: [/peter drucker/i] }
];

const LANGUAGE_MAP: Record<string, string> = {
  por: 'pt',
  spa: 'es',
  eng: 'en',
  fra: 'fr',
  deu: 'de',
  jpn: 'ja',
  cmn: 'zh',
  arb: 'ar',
  hin: 'hi'
};

export function classifyDomain(text: string): Domain {
  const normalized = normalizeForMatch(text);
  let best: Domain = 'geral';
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as Array<[Domain, string[]]>) {
    if (domain === 'geral') continue;
    const score = keywords.reduce((sum, keyword) => sum + countMatches(normalized, normalizeForMatch(keyword)), 0);
    if (score > bestScore) {
      bestScore = score;
      best = domain;
    }
  }

  return bestScore === 0 ? 'geral' : best;
}

export function classifyType(text: string): ContentType {
  const normalized = normalizeForMatch(text);
  let best: ContentType = 'teoria';
  let bestScore = 0;

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS) as Array<[ContentType, string[]]>) {
    const score = keywords.reduce((sum, keyword) => sum + countMatches(normalized, normalizeForMatch(keyword)), 0);
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  return best;
}

export function detectAuthor(text: string) {
  for (const rule of AUTHOR_PATTERNS) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.author;
    }
  }
  return 'unknown';
}

export function detectLanguage(text: string) {
  const result = franc(text.slice(0, 4000), { minLength: 40 });
  return LANGUAGE_MAP[result] ?? 'unknown';
}

function countMatches(text: string, term: string) {
  if (!term) return 0;
  let from = 0;
  let count = 0;
  while (true) {
    const index = text.indexOf(term, from);
    if (index < 0) break;
    count += 1;
    from = index + term.length;
  }
  return count;
}
