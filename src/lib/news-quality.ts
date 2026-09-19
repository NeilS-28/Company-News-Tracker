import { createHash } from 'node:crypto';

export function articleId(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  for (const key of [...parsed.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) parsed.searchParams.delete(key);
  }
  parsed.searchParams.sort();
  return createHash('sha256').update(parsed.toString()).digest('hex');
}

export function isArticleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) && parsed.pathname !== '/';
  } catch {
    return false;
  }
}

export function deduplicateArticles<
  T extends { id: string; title: string; source: string },
>(articles: T[]): T[] {
  const ids = new Set<string>();
  const headlines = new Set<string>();
  return articles.filter((article) => {
    const key = `${article.source.toLowerCase()}:${article.title
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()}`;
    if (ids.has(article.id) || headlines.has(key)) return false;
    ids.add(article.id);
    headlines.add(key);
    return true;
  });
}

// A conservative headline heuristic, not an investment signal or verified sentiment.
export function classifySentiment(
  title: string,
): 'positive' | 'negative' | 'neutral' {
  if (/\b(no|not|never|denies?|despite|but|although)\b/i.test(title))
    return 'neutral';
  const up =
    /\b(surges?|jumps?|gains?|rises?|rall(?:y|ies)|growth|soars?|upgrades?|beats?|outperforms?|boosts?)\b/i.test(
      title,
    );
  const down =
    /\b(plunges?|falls?|drops?|loss(?:es)?|declines?|slumps?|probes?|penalt(?:y|ies)|crash(?:es)?|downgrades?|fraud|warnings?)\b/i.test(
      title,
    );
  return up === down ? 'neutral' : up ? 'positive' : 'negative';
}

export function isCurrentDay(dateStr: string, now = new Date()): boolean {
  const date = new Date(dateStr);
  if (!Number.isFinite(date.getTime()) || date > now) return false;
  const day = (value: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  return day(date) === day(now);
}
