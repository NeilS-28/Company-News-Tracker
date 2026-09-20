import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { getMarketQuote } from '@/lib/providers/market';
import { getAggregatedNews } from '@/lib/providers/news';
import { getCurrentUser } from '@/lib/auth';
import { hasPersistentStore, persistentWatchlist, persistentCompanyIds, updatePersistentWatchlist, deletePersistentWatchlist, addPersistentCompany, removePersistentCompany } from '@/lib/supabase-store';

async function owned(request: NextRequest, id: number) {
  const user = await getCurrentUser(request);
  if (!user) return { user: null, watchlist: null };
  const watchlist = hasPersistentStore ? await persistentWatchlist(id, user.id) : db.getWatchlistById(id);
  if (!watchlist || watchlist.userId !== user.id) return { user, watchlist: null };
  return { user, watchlist };
}
async function companiesFor(id: number) {
  if (!hasPersistentStore) return db.getWatchlistCompanies(id);
  return (await persistentCompanyIds(id)).map(cid => db.getCompanyById(cid)).filter((c): c is NonNullable<typeof c> => Boolean(c));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id); const { user, watchlist } = await owned(request, id);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    if (!watchlist) return NextResponse.json({ success: false, error: 'Watchlist not found' }, { status: 404 });
    const companies = await companiesFor(id);
    const companiesWithQuotes = await Promise.all(companies.map(async c => ({ ...c, quote: await getMarketQuote(c.nseSymbol || c.bseCode || c.ticker, c.nseSymbol ? 'NSE' : 'BSE') })));
    const results = await Promise.all(companies.map(c => getAggregatedNews({ companyId: c.id, limit: 10 })));
    const seen = new Set<number>();
    const news = results.flatMap(r => r.articles).filter(a => !seen.has(a.id) && Boolean(seen.add(a.id))).sort((a,b)=>+new Date(b.publishedAt)-+new Date(a.publishedAt)).slice(0,30);
    return NextResponse.json({ success: true, data: { watchlist, companies: companiesWithQuotes, news } });
  } catch (err) { return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id); const { user, watchlist } = await owned(request, id);
    if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    if (!watchlist) return NextResponse.json({ success: false, error: 'Watchlist not found' }, { status: 404 });
    const name = ((await request.json()).name || '').trim(); if (!name) return NextResponse.json({ success:false,error:'Name is required'},{status:400});
    const updated = hasPersistentStore ? await updatePersistentWatchlist(id, name, user.id) : db.updateWatchlist(id, name, user.id);
    return NextResponse.json({ success: true, data: updated });
  } catch (err) { return NextResponse.json({ success:false,error:err instanceof Error?err.message:'Unknown error'},{status:500}); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id=Number((await params).id); const {user,watchlist}=await owned(request,id);
    if(!user) return NextResponse.json({success:false,error:'Authentication required'},{status:401});
    if(!watchlist) return NextResponse.json({success:false,error:'Watchlist not found'},{status:404});
    const ok=hasPersistentStore?await deletePersistentWatchlist(id,user.id):db.deleteWatchlist(id,user.id);
    return NextResponse.json({success:ok});
  } catch(err){return NextResponse.json({success:false,error:err instanceof Error?err.message:'Unknown error'},{status:500});}
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id=Number((await params).id); const {user,watchlist}=await owned(request,id);
    if(!user) return NextResponse.json({success:false,error:'Authentication required'},{status:401});
    if(!watchlist) return NextResponse.json({success:false,error:'Watchlist not found'},{status:404});
    const {action,companyId}=await request.json(); if(!companyId || !db.getCompanyById(Number(companyId))) return NextResponse.json({success:false,error:'Valid company ID required'},{status:400});
    if(action==='remove') { if(hasPersistentStore) await removePersistentCompany(id,Number(companyId)); else db.removeCompanyFromWatchlist(id,Number(companyId)); return NextResponse.json({success:true,action:'removed'}); }
    if(hasPersistentStore) await addPersistentCompany(id,Number(companyId)); else db.addCompanyToWatchlist(id,Number(companyId));
    return NextResponse.json({success:true,action:'added'});
  } catch(err){return NextResponse.json({success:false,error:err instanceof Error?err.message:'Unknown error'},{status:500});}
}
