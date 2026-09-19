import { getCompanyResearch } from '@/lib/company-research';
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const data = await getCompanyResearch((await params).slug);
  return Response.json(data ? { success: true, data } : { success: false, error: 'Company not found' }, { status: data ? 200 : 404 });
}
