export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function positiveId(value: unknown): number {
  const id =
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0)
    throw new ApiError(400, 'Invalid ID.');
  return id;
}
export function watchlistName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 80)
    throw new ApiError(
      400,
      'Use a watchlist name between 1 and 80 characters.',
    );
  return value.trim();
}
export async function readBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error();
    return body;
  } catch {
    throw new ApiError(400, 'Invalid JSON request.');
  }
}
export function apiFailure(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    error.code === '23514'
  ) {
    return Response.json(
      {
        success: false,
        error:
          'Watchlist limit reached: up to 20 lists and 100 companies per list.',
      },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
  if (!(error instanceof ApiError))
    console.error(
      'Watchlist request failed',
      error instanceof Error ? error.message : 'Database error',
    );
  return Response.json(
    {
      success: false,
      error:
        error instanceof ApiError
          ? error.message
          : 'Unable to save or load watchlists. Please retry.',
    },
    {
      status: error instanceof ApiError ? error.status : 503,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  );
}
export function privateJson(data: unknown, status = 200) {
  return Response.json(
    { success: true, data },
    { status, headers: { 'Cache-Control': 'private, no-store' } },
  );
}
