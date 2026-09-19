import { requireUser } from '@/lib/supabase/server';
import {
  apiFailure,
  privateJson,
  readBody,
  watchlistName,
} from '@/lib/validation';
import { db } from '@/db';

export async function GET(request: Request) {
  try {
    const { client, user } = await requireUser(request);
    const { data, error } = await client
      .from('watchlists')
      .select(
        'id, name, created_at, updated_at, watchlist_companies(company_id)',
      )
      .eq('user_id', user.id)
      .order('created_at');
    if (error) throw error;
    return privateJson(
      data.map((list) => {
        const companies = list.watchlist_companies
          .map((item) => db.getCompanyById(item.company_id))
          .filter(Boolean);
        return {
          id: list.id,
          name: list.name,
          createdAt: list.created_at,
          updatedAt: list.updated_at,
          companies,
          companyCount: companies.length,
        };
      }),
    );
  } catch (error) {
    return apiFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    const { client, user } = await requireUser(request);
    const name = watchlistName((await readBody(request)).name);
    const { data, error } = await client
      .from('watchlists')
      .insert({ name, user_id: user.id })
      .select('id, name')
      .single();
    if (error) throw error;
    return privateJson(data, 201);
  } catch (error) {
    return apiFailure(error);
  }
}
