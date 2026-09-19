import 'server-only';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';
import { getAggregatedNews } from '@/lib/providers/news';

export async function getCompanyResearch(slug: string) {
  const company = db.getCompanyBySlug(slug);
  if (!company) return null;
  const [quote, newsResult] = await Promise.all([
    getMarketQuote(company.ticker),
    getAggregatedNews({ companyId: company.id, limit: 25 })
      .then((result) => ({ news: result.articles, newsError: null }))
      .catch(() => ({
        news: [],
        newsError: 'News is temporarily unavailable. Please retry.',
      })),
  ]);
  return {
    company,
    quote,
    ...newsResult,
    peers: db
      .getCompaniesBySector(company.sectorSlug)
      .filter((c) => c.id !== company.id)
      .slice(0, 5),
  };
}
export type CompanyResearch = NonNullable<
  Awaited<ReturnType<typeof getCompanyResearch>>
>;
