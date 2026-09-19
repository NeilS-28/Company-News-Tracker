import { requireUser } from '@/lib/supabase/server';
import {
  ApiError,
  apiFailure,
  privateJson,
  positiveId,
  readBody,
  watchlistName,
} from '@/lib/validation';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';
import { getAggregatedNews } from '@/lib/providers/news';
import { deduplicateArticles } from '@/lib/news-quality';

type Context = { params: Promise<{ id: string }> };
async function ownedList(request: Request, context: Context) {
  const { client, user } = await requireUser(request);
  const id = positiveId((await context.params).id);
  const { data: watchlist, error } = await client
    .from('watchlists')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!watchlist) throw new ApiError(404, 'Watchlist not found.');
  return { client, user, id, watchlist };
}
export async function GET(request: Request, context: Context) {
  try {
    const { client, id, watchlist } = await ownedList(request, context);
    const { data, error } = await client
      .from('watchlist_companies')
      .select('company_id')
      .eq('watchlist_id', id)
      .order('created_at')
      .limit(100);
    if (error) throw error;
    const companies = data
      .map((item) => db.getCompanyById(item.company_id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    // Bound upstream fan-out; the full list remains visible even when news is limited.
    const newsCompanies = companies.slice(0, 20);
    const [quotes, results] = await Promise.all([
      Promise.all(
        companies.map(async (c) => ({
          ...c,
          quote: await getMarketQuote(c.ticker),
        })),
      ),
      Promise.allSettled(
        newsCompanies.map((c) =>
          getAggregatedNews({ companyId: c.id, limit: 10 }),
        ),
      ),
    ]);
    const news = deduplicateArticles(
      results.flatMap((result) =>
        result.status === 'fulfilled' ? result.value.articles : [],
      ),
    )
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, 50);
    return privateJson({
      watchlist,
      companies: quotes,
      news,
      newsWarning: results.some((r) => r.status === 'rejected')
        ? 'Some news sources could not be loaded. Please retry.'
        : companies.length > 20
          ? 'News is shown for the first 20 companies in this list.'
          : null,
    });
  } catch (error) {
    return apiFailure(error);
  }
}
export async function PUT(request: Request, context: Context) {
  try {
    const { client, user, id } = await ownedList(request, context);
    const name = watchlistName((await readBody(request)).name);
    const { data, error } = await client
      .from('watchlists')
      .update({ name })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name')
      .single();
    if (error) throw error;
    return privateJson(data);
  } catch (error) {
    return apiFailure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  try {
    const { client, user, id } = await ownedList(request, context);
    const { error } = await client
      .from('watchlists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw error;
    return privateJson(null);
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const { client, id } = await ownedList(request, context);
    const body = await readBody(request);
    const companyId = positiveId(body.companyId);
    if (!db.getCompanyById(companyId))
      throw new ApiError(400, 'Unknown company.');
    if (body.action !== 'add' && body.action !== 'remove')
      throw new ApiError(400, 'Action must be add or remove.');
    const result =
      body.action === 'add'
        ? await client
            .from('watchlist_companies')
            .upsert(
              { watchlist_id: id, company_id: companyId },
              { onConflict: 'watchlist_id,company_id', ignoreDuplicates: true },
            )
        : await client
            .from('watchlist_companies')
            .delete()
            .eq('watchlist_id', id)
            .eq('company_id', companyId);
    if (result.error) throw result.error;
    return privateJson({ action: body.action });
  } catch (error) {
    return apiFailure(error);
  }
}
