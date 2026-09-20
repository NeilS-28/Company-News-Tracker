import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    const sectors = db.getSectors();
    const companies = db.getCompanies();

    const sectorsWithCounts = sectors.map((sector) => {
      const sectorCompanies = companies.filter(c => c.sectorSlug === sector.slug);
      return {
        ...sector,
        companyCount: sectorCompanies.length,
        companies: sectorCompanies.map(c => ({
          id: c.id,
          name: c.name,
          shortName: c.shortName,
          ticker: c.ticker,
          slug: c.slug,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: sectorsWithCounts,
      total: sectorsWithCounts.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
