import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { getCompanyResearch } from '@/lib/company-research';
import CompanyResearchView from '@/components/CompanyResearchView';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = db.getCompanyBySlug((await params).slug);
  if (!company) return { title: 'Company not found | MarketPulse' };
  const title = `${company.shortName} (${company.ticker}) News & Research | MarketPulse`;
  return {
    title,
    description: company.description,
    openGraph: { title, description: company.description },
  };
}
export default async function CompanyPage({ params }: Props) {
  const data = await getCompanyResearch((await params).slug);
  if (!data) notFound();
  return <CompanyResearchView key={data.company.id} data={data} />;
}
