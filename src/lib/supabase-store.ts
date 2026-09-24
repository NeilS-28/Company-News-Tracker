import type { UserRow, WatchlistRow } from '@/db';

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const hasPersistentStore = Boolean(url && key);

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!url || !key) throw new Error('Persistent store is not configured');
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Persistent store request failed (${res.status}): ${errorBody.slice(0, 500)}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

interface PersistentUser { id: string; name: string; email: string; password_hash: string; salt: string; created_at: string; email_verified_at?: string | null; session_version?: number }
interface PersistentWatchlist { id: number; user_id: string; name: string; created_at: string; updated_at: string }
interface PersistentCompany { company_id: number }

const mapUser = (u: PersistentUser): UserRow => ({ id: u.id, name: u.name, email: u.email, passwordHash: u.password_hash, salt: u.salt, createdAt: u.created_at, emailVerifiedAt: u.email_verified_at, sessionVersion: u.session_version });
const mapWatchlist = (w: PersistentWatchlist): WatchlistRow => ({ id: Number(w.id), userId: w.user_id, name: w.name, createdAt: w.created_at, updatedAt: w.updated_at });

export async function persistentUserByEmail(email: string) {
  const rows = await request<PersistentUser[]>(`marketpulse_users?email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`);
  return rows[0] ? mapUser(rows[0]) : null;
}
export async function persistentUserById(id: string) {
  const rows = await request<PersistentUser[]>(`marketpulse_users?id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ? mapUser(rows[0]) : null;
}
export async function createPersistentUser(user: Omit<UserRow, 'createdAt'>, verifyEmail = false) {
  const rows = await request<PersistentUser[]>('marketpulse_users', { method: 'POST', body: JSON.stringify({ id: user.id, name: user.name, email: user.email.toLowerCase(), password_hash: user.passwordHash, salt: user.salt, ...(verifyEmail ? { email_verified_at: null } : {}) }) });
  return mapUser(rows[0]);
}
export async function persistentWatchlists(userId: string) {
  const rows = await request<PersistentWatchlist[]>(`marketpulse_watchlists?user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`);
  return rows.map(mapWatchlist);
}
export async function persistentWatchlist(id: number, userId: string) {
  const rows = await request<PersistentWatchlist[]>(`marketpulse_watchlists?id=eq.${id}&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  return rows[0] ? mapWatchlist(rows[0]) : null;
}
export async function createPersistentWatchlist(name: string, userId: string) {
  const rows = await request<PersistentWatchlist[]>('marketpulse_watchlists', { method: 'POST', body: JSON.stringify({ name, user_id: userId }) });
  return mapWatchlist(rows[0]);
}
export async function updatePersistentWatchlist(id: number, name: string, userId: string) {
  const rows = await request<PersistentWatchlist[]>(`marketpulse_watchlists?id=eq.${id}&user_id=eq.${encodeURIComponent(userId)}`, { method: 'PATCH', body: JSON.stringify({ name, updated_at: new Date().toISOString() }) });
  return rows[0] ? mapWatchlist(rows[0]) : null;
}
export async function deletePersistentWatchlist(id: number, userId: string) {
  const rows = await request<PersistentWatchlist[]>(`marketpulse_watchlists?id=eq.${id}&user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
  return rows.length > 0;
}
export async function persistentCompanyIds(watchlistId: number) {
  const rows = await request<PersistentCompany[]>(`marketpulse_watchlist_companies?watchlist_id=eq.${watchlistId}&order=position.asc`);
  return rows.map(r => Number(r.company_id));
}
export async function addPersistentCompany(watchlistId: number, companyId: number) {
  const existing = await request<PersistentCompany[]>(`marketpulse_watchlist_companies?watchlist_id=eq.${watchlistId}&company_id=eq.${companyId}&limit=1`);
  if (existing.length) return false;
  const current = await persistentCompanyIds(watchlistId);
  await request<PersistentCompany[]>('marketpulse_watchlist_companies', { method: 'POST', body: JSON.stringify({ watchlist_id: watchlistId, company_id: companyId, position: current.length }) });
  return true;
}
export async function removePersistentCompany(watchlistId: number, companyId: number) {
  await request<PersistentCompany[]>(`marketpulse_watchlist_companies?watchlist_id=eq.${watchlistId}&company_id=eq.${companyId}`, { method: 'DELETE' });
  return true;
}
