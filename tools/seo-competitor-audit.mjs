import { mkdir, writeFile } from 'node:fs/promises';

const OUTPUT_DIR = new URL('../docs/seo-audit/', import.meta.url);
const MAX_RESULTS = Number(process.env.SEO_AUDIT_LIMIT || 20);
const USER_AGENT = 'Mozilla/5.0 (compatible; PureAutoLikeSeoAudit/1.0; +https://zgnoff.github.io/pureautolike/)';

const queries = [
  'pure autolike',
  'pure autoclick',
  'pure auto liker extension',
  'pure auto clicker extension',
  'pure app auto like',
  'pure web automation',
  'pure hidden photo opener',
  'pure telegram notifications',
  'chrome extension for pure',
  'pure dating app automation',
  'pure bot',
  'pure unban',
  'pure автолайк',
  'пьюр автолайк',
  'автолайкер Pure',
  'автолайкер для Pure',
  'автокликер Pure',
  'бот Pure',
  'пьюр бот',
  'разбан Pure'
];

const seedUrls = [
  'https://pure-autoclick.ru/',
  'https://pure-helper.ru/',
  'https://onlylike.online/',
  'https://megakeys.store/',
  'https://github.com/topics/pure-app-autoliker',
  'https://chromewebstore.google.com/detail/auto-like/',
  'https://rutube.ru/video/'
];

function decodeHtml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

function stripHtml(html = '') {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(html, tag) {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  return Array.from(html.matchAll(regex))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean)
    .slice(0, 16);
}

function extractMeta(html, name) {
  const patterns = [
    new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${name}["'])[^>]*content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta\\b(?=[^>]*content=["']([^"']*)["'])(?=[^>]*(?:name|property)=["']${name}["'])[^>]*>`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]).trim();
  }
  return '';
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    if (parsed.hostname.includes('duckduckgo.com') && parsed.searchParams.get('uddg')) {
      return normalizeUrl(parsed.searchParams.get('uddg'));
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

async function fetchText(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      redirect: 'follow',
      signal: controller.signal
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, url: response.url, text };
  } catch (error) {
    return { ok: false, status: 0, url, text: '', error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function searchDuckDuckGo(query) {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const { text } = await fetchText(searchUrl);
  const links = [];
  const patterns = [
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"/gi,
    /<a[^>]+href="([^"]+)"[^>]*class="result__a"/gi,
    /uddg=([^"&]+)/gi
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const raw = decodeURIComponent(decodeHtml(match[1]));
      const url = normalizeUrl(raw);
      if (!url) continue;
      if (url.includes('duckduckgo.com')) continue;
      if (url.includes('zgnoff.github.io')) continue;
      links.push(url);
    }
  }

  return Array.from(new Set(links)).slice(0, 10);
}

function countMatches(text, terms) {
  const lower = text.toLowerCase();
  return terms.reduce((count, term) => count + (lower.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function analyzePage(url, html) {
  const text = stripHtml(html);
  const lower = text.toLowerCase();
  const title = stripHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = extractMeta(html, 'description');
  const h1 = extractTag(html, 'h1');
  const h2 = extractTag(html, 'h2');
  const h3 = extractTag(html, 'h3');
  const jsonLdTypes = Array.from(html.matchAll(/"@type"\s*:\s*"([^"]+)"/gi)).map((match) => match[1]);

  const strengths = [];
  if (title.length >= 35 && title.length <= 72) strengths.push('search-sized title');
  if (description.length >= 110 && description.length <= 170) strengths.push('search-sized description');
  if (h1.length === 1) strengths.push('single clear h1');
  if (h2.length >= 3) strengths.push('multiple intent sections');
  if (lower.includes('faq') || lower.includes('вопрос')) strengths.push('faq block');
  if (jsonLdTypes.some((type) => /faqpage/i.test(type))) strengths.push('FAQ schema');
  if (jsonLdTypes.some((type) => /howto/i.test(type))) strengths.push('HowTo schema');
  if (countMatches(lower, ['chrome', 'extension', 'расширение', 'web store']) >= 1) strengths.push('install-channel clarity');
  if (countMatches(lower, ['как работает', 'how it works', 'how does', 'устроено']) >= 1) strengths.push('how-it-works explanation');
  if (countMatches(lower, ['цена', 'price', 'free', 'бесплатно', 'стоимость']) >= 1) strengths.push('price/free intent');
  if (countMatches(lower, ['разбан', 'unban', 'бан', 'ban']) >= 1) strengths.push('unban/ban intent coverage');
  if (countMatches(lower, ['telegram', 'телеграм']) >= 1) strengths.push('telegram intent coverage');
  if (countMatches(lower, ['pure', 'пьюр']) >= 1 && countMatches(lower, ['autolike', 'автолайк', 'autoclick', 'автоклик', 'автолайкер']) >= 1) strengths.push('exact query language');
  if (countMatches(lower, ['отзывы', 'reviews', 'звезд', 'rating']) >= 1) strengths.push('social-proof language');

  return {
    url,
    title,
    description,
    h1,
    h2: h2.slice(0, 8),
    h3: h3.slice(0, 8),
    wordCount: text ? text.split(/\s+/).length : 0,
    jsonLdTypes: Array.from(new Set(jsonLdTypes)),
    strengths
  };
}

function summarizeFindings(pages) {
  const strengthCounts = new Map();
  const headings = [];
  for (const page of pages) {
    for (const strength of page.strengths) {
      strengthCounts.set(strength, (strengthCounts.get(strength) || 0) + 1);
    }
    headings.push(...page.h1, ...page.h2);
  }

  return {
    strengthCounts: Array.from(strengthCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([strength, count]) => ({ strength, count })),
    headingPatterns: headings
      .filter(Boolean)
      .slice(0, 80)
  };
}

function toMarkdown({ collectedAt, queries, results, summary }) {
  const lines = [];
  lines.push('# SEO Competitor Audit');
  lines.push('');
  lines.push(`Collected: ${collectedAt}`);
  lines.push('');
  lines.push('## Queries');
  for (const query of queries) lines.push(`- ${query}`);
  lines.push('');
  lines.push('## Strongest Reusable Patterns');
  for (const item of summary.strengthCounts) lines.push(`- ${item.strength}: ${item.count}/${results.length}`);
  lines.push('');
  lines.push('## Top Pages Reviewed');
  for (const [index, result] of results.entries()) {
    lines.push(`### ${index + 1}. ${result.title || result.url}`);
    lines.push('');
    lines.push(`URL: ${result.url}`);
    lines.push('');
    if (result.description) lines.push(`Description: ${result.description}`);
    if (result.h1.length) lines.push(`H1: ${result.h1.join(' | ')}`);
    if (result.h2.length) lines.push(`H2: ${result.h2.join(' | ')}`);
    if (result.strengths.length) lines.push(`Strengths: ${result.strengths.join(', ')}`);
    lines.push('');
  }
  lines.push('## Implementation Notes');
  lines.push('');
  lines.push('- Reuse patterns, not copy. Keep all competitor wording out of PureAutoLike pages.');
  lines.push('- Keep claims truthful: no match guarantee, no unban promise, no geolocation promise.');
  lines.push('- Prefer separate intent pages over keyword stuffing on one page.');
  lines.push('- Add FAQ/HowTo/SoftwareApplication structured data where it matches visible content.');
  return lines.join('\n');
}

const foundUrls = [];
for (const query of queries) {
  const urls = await searchDuckDuckGo(query);
  foundUrls.push(...urls);
}

const candidateUrls = Array.from(new Set([...foundUrls, ...seedUrls]))
  .filter((url) => /^https?:\/\//.test(url))
  .slice(0, MAX_RESULTS);

const results = [];
for (const url of candidateUrls) {
  const response = await fetchText(url);
  if (!response.text || !/<html|<title|<body/i.test(response.text)) continue;
  results.push(analyzePage(response.url || url, response.text));
}

const report = {
  collectedAt: new Date().toISOString(),
  queries,
  candidateUrls,
  results,
  summary: summarizeFindings(results)
};

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(new URL('competitor-audit.json', OUTPUT_DIR), JSON.stringify(report, null, 2));
await writeFile(new URL('competitor-audit.md', OUTPUT_DIR), toMarkdown(report));

console.log(`SEO competitor audit completed: ${results.length} pages reviewed`);
console.log(`Markdown: ${new URL('competitor-audit.md', OUTPUT_DIR).pathname}`);
