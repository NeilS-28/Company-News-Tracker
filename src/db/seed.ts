// Seed script: populates the database with NIFTY 50 companies, sectors, and sample news
// Run with: npm run db:seed

import { db, type DbSchema } from './index';
import equitiesMaster from './equities_master.json';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================
// SECTORS
// ============================================================
const sectorData = [
  { name: 'Information Technology', description: 'Companies in software services, IT consulting, and digital solutions' },
  { name: 'Financial Services', description: 'Banks, NBFCs, insurance companies, and financial intermediaries' },
  { name: 'Oil, Gas & Consumable Fuels', description: 'Oil exploration, refining, gas distribution, and energy companies' },
  { name: 'Automobiles & Auto Components', description: 'Vehicle manufacturers, auto parts, and related industries' },
  { name: 'Fast Moving Consumer Goods', description: 'Consumer packaged goods, food & beverages, personal care products' },
  { name: 'Pharmaceuticals', description: 'Pharmaceutical manufacturing, drug discovery, and healthcare products' },
  { name: 'Metals & Mining', description: 'Steel, aluminium, copper, and mining companies' },
  { name: 'Construction', description: 'Engineering, construction, infrastructure, and building materials' },
  { name: 'Telecommunication', description: 'Telecom service providers and communication infrastructure' },
  { name: 'Power', description: 'Power generation, transmission, distribution, and utilities' },
  { name: 'Consumer Durables', description: 'Consumer electronics, jewellery, watches, and durable goods' },
  { name: 'Healthcare Services', description: 'Hospitals, diagnostics, and healthcare service providers' },
  { name: 'Capital Goods', description: 'Defence, electrical equipment, heavy engineering, and industrial manufacturing' },
  { name: 'Diversified', description: 'Conglomerates with interests across multiple sectors' },
  { name: 'Services', description: 'Ports, logistics, infrastructure services, and diversified services' },
  { name: 'Consumer Services', description: 'Tourism, hotels, food services, and consumer-facing services' },
  { name: 'Chemicals', description: 'Specialty chemicals, agrochemicals, petrochemicals, and basic industrial chemicals' },
  { name: 'Realty & Real Estate', description: 'Residential and commercial real estate developers, REITs, and construction materials' },
  { name: 'Textiles & Apparel', description: 'Yarn, cotton, spinning, fabrics, apparel, and fashion garment manufacturers' },
  { name: 'Media & Entertainment', description: 'Television broadcasting, digital streaming, film entertainment, and publication' },
  { name: 'Forest Materials & Paper', description: 'Paper manufacturing, packaging solutions, plywood, and forest products' },
];

const sectors = sectorData.map((s, i) => ({
  id: i + 1,
  name: s.name,
  slug: slugify(s.name),
  description: s.description,
}));


function getSectorSlug(name: string): string {
  const sector = sectors.find(s => s.name === name);
  if (!sector) throw new Error(`Sector not found: ${name}`);
  return sector.slug;
}

// ============================================================
// NIFTY 50 COMPANIES (current constituents as of Sep 2025)
// ============================================================
const companyData: Array<{
  name: string;
  shortName: string;
  ticker: string;
  sector: string;
  industry: string;
  description: string;
}> = [
  { name: 'Reliance Industries Ltd', shortName: 'Reliance', ticker: 'RELIANCE', sector: 'Oil, Gas & Consumable Fuels', industry: 'Oil & Gas Refining', description: 'India\'s largest private sector company, with interests in petrochemicals, refining, oil & gas, telecom (Jio), and retail.' },
  { name: 'Tata Consultancy Services Ltd', shortName: 'TCS', ticker: 'TCS', sector: 'Information Technology', industry: 'IT Services & Consulting', description: 'India\'s largest IT services company and a part of the Tata Group.' },
  { name: 'HDFC Bank Ltd', shortName: 'HDFC Bank', ticker: 'HDFCBANK', sector: 'Financial Services', industry: 'Private Sector Bank', description: 'India\'s largest private sector bank by market capitalisation.' },
  { name: 'Infosys Ltd', shortName: 'Infosys', ticker: 'INFY', sector: 'Information Technology', industry: 'IT Services & Consulting', description: 'Global leader in next-generation digital services and consulting.' },
  { name: 'ICICI Bank Ltd', shortName: 'ICICI Bank', ticker: 'ICICIBANK', sector: 'Financial Services', industry: 'Private Sector Bank', description: 'One of India\'s leading private sector banks offering a wide range of banking products.' },
  { name: 'Hindustan Unilever Ltd', shortName: 'HUL', ticker: 'HINDUNILVR', sector: 'Fast Moving Consumer Goods', industry: 'FMCG - Personal Care', description: 'India\'s largest FMCG company and a subsidiary of Unilever.' },
  { name: 'ITC Ltd', shortName: 'ITC', ticker: 'ITC', sector: 'Fast Moving Consumer Goods', industry: 'FMCG - Diversified', description: 'Diversified conglomerate with businesses in FMCG, hotels, paperboards, and agri-business.' },
  { name: 'State Bank of India', shortName: 'SBI', ticker: 'SBIN', sector: 'Financial Services', industry: 'Public Sector Bank', description: 'India\'s largest public sector bank and a Fortune 500 company.' },
  { name: 'Bharti Airtel Ltd', shortName: 'Airtel', ticker: 'BHARTIARTL', sector: 'Telecommunication', industry: 'Telecom Services', description: 'India\'s second-largest telecom operator with operations in 18 countries.' },
  { name: 'Larsen & Toubro Ltd', shortName: 'L&T', ticker: 'LT', sector: 'Construction', industry: 'Engineering & Construction', description: 'Indian multinational engaged in EPC projects, hi-tech manufacturing, and services.' },
  { name: 'Kotak Mahindra Bank Ltd', shortName: 'Kotak Bank', ticker: 'KOTAKBANK', sector: 'Financial Services', industry: 'Private Sector Bank', description: 'One of India\'s leading private sector banks with comprehensive financial solutions.' },
  { name: 'Axis Bank Ltd', shortName: 'Axis Bank', ticker: 'AXISBANK', sector: 'Financial Services', industry: 'Private Sector Bank', description: 'Third-largest private sector bank in India.' },
  { name: 'Bajaj Finance Ltd', shortName: 'Bajaj Finance', ticker: 'BAJFINANCE', sector: 'Financial Services', industry: 'NBFC', description: 'India\'s largest NBFC by market cap, offering consumer finance, SME lending, and commercial lending.' },
  { name: 'Mahindra & Mahindra Ltd', shortName: 'M&M', ticker: 'M&M', sector: 'Automobiles & Auto Components', industry: 'Automobile Manufacturer', description: 'Indian multinational manufacturer of automobiles, farm equipment, and financial services.' },
  { name: 'Maruti Suzuki India Ltd', shortName: 'Maruti', ticker: 'MARUTI', sector: 'Automobiles & Auto Components', industry: 'Passenger Vehicles', description: 'India\'s largest passenger car maker and a subsidiary of Suzuki Motor Corporation.' },
  { name: 'Sun Pharmaceutical Industries Ltd', shortName: 'Sun Pharma', ticker: 'SUNPHARMA', sector: 'Pharmaceuticals', industry: 'Pharmaceuticals', description: 'India\'s largest pharmaceutical company and the world\'s fourth-largest specialty generic pharmaceutical company.' },
  { name: 'Titan Company Ltd', shortName: 'Titan', ticker: 'TITAN', sector: 'Consumer Durables', industry: 'Jewellery & Watches', description: 'India\'s leading consumer lifestyle company in jewellery, watches, and eyewear.' },
  { name: 'NTPC Ltd', shortName: 'NTPC', ticker: 'NTPC', sector: 'Power', industry: 'Power Generation', description: 'India\'s largest energy conglomerate with a total installed capacity of over 76 GW.' },
  { name: 'Tata Motors Ltd', shortName: 'Tata Motors', ticker: 'TATAMOTORS', sector: 'Automobiles & Auto Components', industry: 'Automobile Manufacturer', description: 'Global automobile manufacturer and owner of Jaguar Land Rover.' },
  { name: 'Asian Paints Ltd', shortName: 'Asian Paints', ticker: 'ASIANPAINT', sector: 'Consumer Durables', industry: 'Paints & Coatings', description: 'India\'s leading paint company and Asia\'s second-largest paint company.' },
  { name: 'HCL Technologies Ltd', shortName: 'HCL Tech', ticker: 'HCLTECH', sector: 'Information Technology', industry: 'IT Services & Consulting', description: 'Global technology company with expertise in digital, engineering, cloud, and AI.' },
  { name: 'Power Grid Corporation of India Ltd', shortName: 'Power Grid', ticker: 'POWERGRID', sector: 'Power', industry: 'Power Transmission', description: 'Central transmission utility of India, operating the national and regional power grids.' },
  { name: 'Wipro Ltd', shortName: 'Wipro', ticker: 'WIPRO', sector: 'Information Technology', industry: 'IT Services & Consulting', description: 'Leading global IT consulting and business process services company.' },
  { name: 'Oil and Natural Gas Corporation Ltd', shortName: 'ONGC', ticker: 'ONGC', sector: 'Oil, Gas & Consumable Fuels', industry: 'Oil Exploration', description: 'India\'s largest crude oil and natural gas company, a Maharatna PSU.' },
  { name: 'UltraTech Cement Ltd', shortName: 'UltraTech', ticker: 'ULTRACEMCO', sector: 'Construction', industry: 'Cement', description: 'India\'s largest manufacturer of grey cement, ready-mix concrete, and white cement.' },
  { name: 'JSW Steel Ltd', shortName: 'JSW Steel', ticker: 'JSWSTEEL', sector: 'Metals & Mining', industry: 'Steel', description: 'India\'s leading integrated steel manufacturer and part of the JSW Group.' },
  { name: 'Adani Ports and SEZ Ltd', shortName: 'Adani Ports', ticker: 'ADANIPORTS', sector: 'Services', industry: 'Port & Logistics', description: 'India\'s largest commercial port operator with a network of strategically located ports.' },
  { name: 'Nestle India Ltd', shortName: 'Nestle India', ticker: 'NESTLEIND', sector: 'Fast Moving Consumer Goods', industry: 'FMCG - Food Products', description: 'Leading food and beverage company in India, known for brands like Maggi, Nescafe, and KitKat.' },
  { name: 'Tech Mahindra Ltd', shortName: 'Tech Mahindra', ticker: 'TECHM', sector: 'Information Technology', industry: 'IT Services & Consulting', description: 'Provider of digital transformation, consulting, and business re-engineering services.' },
  { name: 'IndusInd Bank Ltd', shortName: 'IndusInd Bank', ticker: 'INDUSINDBK', sector: 'Financial Services', industry: 'Private Sector Bank', description: 'New-generation private sector bank focused on retail banking and consumer finance.' },
  { name: 'Coal India Ltd', shortName: 'Coal India', ticker: 'COALINDIA', sector: 'Oil, Gas & Consumable Fuels', industry: 'Coal Mining', description: 'World\'s largest coal-producing company, a Maharatna PSU.' },
  { name: 'Bajaj Finserv Ltd', shortName: 'Bajaj Finserv', ticker: 'BAJAJFINSV', sector: 'Financial Services', industry: 'Holding Company - Financial Services', description: 'Holding company of the Bajaj Group\'s financial services businesses including insurance and lending.' },
  { name: 'Hindalco Industries Ltd', shortName: 'Hindalco', ticker: 'HINDALCO', sector: 'Metals & Mining', industry: 'Aluminium & Copper', description: 'World\'s largest aluminium rolling company and a metals flagship of the Aditya Birla Group.' },
  { name: 'Grasim Industries Ltd', shortName: 'Grasim', ticker: 'GRASIM', sector: 'Diversified', industry: 'Diversified - Cement & Textiles', description: 'Diversified conglomerate and flagship of the Aditya Birla Group.' },
  { name: 'Dr. Reddy\'s Laboratories Ltd', shortName: 'Dr. Reddy\'s', ticker: 'DRREDDY', sector: 'Pharmaceuticals', industry: 'Pharmaceuticals', description: 'Global pharmaceutical company with a strong presence in generics and biosimilars.' },
  { name: 'Cipla Ltd', shortName: 'Cipla', ticker: 'CIPLA', sector: 'Pharmaceuticals', industry: 'Pharmaceuticals', description: 'Global pharmaceutical company known for affordable medicines, especially in respiratory and anti-retroviral segments.' },
  { name: 'Tata Steel Ltd', shortName: 'Tata Steel', ticker: 'TATASTEEL', sector: 'Metals & Mining', industry: 'Steel', description: 'One of the world\'s most geographically diversified steel producers and part of Tata Group.' },
  { name: 'Eicher Motors Ltd', shortName: 'Eicher Motors', ticker: 'EICHERMOT', sector: 'Automobiles & Auto Components', industry: 'Two-Wheelers', description: 'Parent company of Royal Enfield motorcycles and Eicher commercial vehicles (JV with Volvo).' },
  { name: 'Divi\'s Laboratories Ltd', shortName: 'Divi\'s Labs', ticker: 'DIVISLAB', sector: 'Pharmaceuticals', industry: 'Pharmaceuticals - API', description: 'Leading manufacturer of active pharmaceutical ingredients (APIs) and custom synthesis.' },
  { name: 'Bharat Petroleum Corporation Ltd', shortName: 'BPCL', ticker: 'BPCL', sector: 'Oil, Gas & Consumable Fuels', industry: 'Oil Refining & Marketing', description: 'India\'s second-largest government-owned oil refining and marketing corporation.' },
  { name: 'Apollo Hospitals Enterprise Ltd', shortName: 'Apollo Hospitals', ticker: 'APOLLOHOSP', sector: 'Healthcare Services', industry: 'Hospitals', description: 'India\'s largest integrated healthcare company with a network of hospitals across the country.' },
  { name: 'Hero MotoCorp Ltd', shortName: 'Hero MotoCorp', ticker: 'HEROMOTOCO', sector: 'Automobiles & Auto Components', industry: 'Two-Wheelers', description: 'World\'s largest manufacturer of motorcycles and scooters.' },
  { name: 'Britannia Industries Ltd', shortName: 'Britannia', ticker: 'BRITANNIA', sector: 'Fast Moving Consumer Goods', industry: 'FMCG - Food Products', description: 'One of India\'s leading food companies, known for biscuits, bread, and dairy products.' },
  { name: 'Tata Consumer Products Ltd', shortName: 'Tata Consumer', ticker: 'TATACONSUM', sector: 'Fast Moving Consumer Goods', industry: 'FMCG - Food & Beverages', description: 'Consumer products company with presence in beverages, food, and water purifiers.' },
  { name: 'Bajaj Auto Ltd', shortName: 'Bajaj Auto', ticker: 'BAJAJ-AUTO', sector: 'Automobiles & Auto Components', industry: 'Two & Three-Wheelers', description: 'India\'s largest exporter of motorcycles and three-wheelers.' },
  { name: 'Shriram Finance Ltd', shortName: 'Shriram Finance', ticker: 'SHRIRAMFIN', sector: 'Financial Services', industry: 'NBFC', description: 'Leading NBFC focused on commercial vehicle financing, consumer and small business loans.' },
  { name: 'HDFC Life Insurance Company Ltd', shortName: 'HDFC Life', ticker: 'HDFCLIFE', sector: 'Financial Services', industry: 'Life Insurance', description: 'One of India\'s leading private life insurance companies.' },
  { name: 'SBI Life Insurance Company Ltd', shortName: 'SBI Life', ticker: 'SBILIFE', sector: 'Financial Services', industry: 'Life Insurance', description: 'Leading life insurance company promoted by State Bank of India and BNP Paribas.' },
  { name: 'Adani Enterprises Ltd', shortName: 'Adani Enterprises', ticker: 'ADANIENT', sector: 'Diversified', industry: 'Diversified - Infrastructure', description: 'Flagship company of the Adani Group with interests in mining, solar, defence, airports, and data centres.' },
  { name: 'Bharat Electronics Ltd', shortName: 'BEL', ticker: 'BEL', sector: 'Capital Goods', industry: 'Defence Electronics', description: 'India\'s premier defence electronics company, a Navratna PSU under the Ministry of Defence.' },
];

const nifty50Tickers = new Set(companyData.map(c => c.ticker));

const additionalCompanies = (equitiesMaster as Array<{
  name: string;
  shortName: string;
  ticker: string;
  sector: string;
  industry: string;
  description: string;
  isin: string;
}>)
  .filter(e => !nifty50Tickers.has(e.ticker))
  .map((e, idx) => ({
    id: companyData.length + idx + 1,
    name: e.name,
    shortName: e.shortName,
    ticker: e.ticker,
    sector: e.sector,
    sectorSlug: getSectorSlug(e.sector),
    industry: e.industry,
    description: e.description,
    logoUrl: null,
    isNifty50: false,
    isActive: true,
    slug: slugify(e.ticker),
  }));

const companiesArr = [
  ...companyData.map((c, i) => ({
    id: i + 1,
    name: c.name,
    shortName: c.shortName,
    ticker: c.ticker,
    sector: c.sector,
    sectorSlug: getSectorSlug(c.sector),
    industry: c.industry,
    description: c.description,
    logoUrl: null,
    isNifty50: true,
    isActive: true,
    slug: slugify(c.shortName),
  })),
  ...additionalCompanies,
];

// ============================================================
// SAMPLE NEWS ARTICLES
// ============================================================
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
  return d.toISOString();
}

interface SeedArticle {
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  sentiment: string | null;
  category: string;
  companyTickers: string[];
  sectorNames: string[];
  daysAgo: number;
}

const sampleNews: SeedArticle[] = [
  // Market-wide
  { title: 'NIFTY 50 hits record high as FII inflows surge', summary: 'The benchmark NIFTY 50 index touched a new all-time high, driven by strong foreign institutional investor inflows and positive global cues. Banking and IT stocks led the rally.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'other', companyTickers: [], sectorNames: ['Financial Services', 'Information Technology'], daysAgo: 0 },
  { title: 'RBI holds repo rate steady at 6.5%, maintains accommodative stance', summary: 'The Reserve Bank of India kept the benchmark repo rate unchanged at 6.5% for the eighth consecutive meeting, while maintaining its focus on withdrawal of accommodation.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'neutral', category: 'regulation', companyTickers: [], sectorNames: ['Financial Services'], daysAgo: 1 },
  { title: 'Indian rupee strengthens against US dollar on strong FII inflows', summary: 'The Indian rupee appreciated against the US dollar, supported by significant foreign institutional investor inflows into Indian equities and a weakening dollar index.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'other', companyTickers: [], sectorNames: [], daysAgo: 1 },

  // Reliance
  { title: 'Reliance Industries announces ₹75,000 crore investment in green energy', summary: 'RIL Chairman Mukesh Ambani unveiled an ambitious plan to invest ₹75,000 crore in renewable energy over the next three years, including solar manufacturing, battery storage, and green hydrogen.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['RELIANCE'], sectorNames: ['Oil, Gas & Consumable Fuels', 'Power'], daysAgo: 0 },
  { title: 'Jio adds 8.2 million subscribers in Q1, ARPU rises to ₹203', summary: 'Reliance Jio added 8.2 million net subscribers during the quarter, taking its total subscriber base to over 490 million. Average revenue per user rose to ₹203.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'results', companyTickers: ['RELIANCE'], sectorNames: ['Telecommunication'], daysAgo: 2 },
  { title: 'Reliance Retail revenue crosses ₹3 lakh crore annualised run-rate', summary: 'Reliance Retail Ventures reported strong quarterly results with revenue crossing the ₹3 lakh crore annualised mark, driven by store expansion and digital commerce growth.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['RELIANCE'], sectorNames: ['Fast Moving Consumer Goods'], daysAgo: 3 },

  // TCS
  { title: 'TCS wins $2.5 billion deal from UK-based financial services firm', summary: 'Tata Consultancy Services secured one of its largest deals, a $2.5 billion multi-year engagement with a leading UK financial services company for digital transformation services.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['TCS'], sectorNames: ['Information Technology'], daysAgo: 1 },
  { title: 'TCS reports 8.7% YoY revenue growth in Q1, margins improve', summary: 'TCS reported revenue growth of 8.7% year-on-year in constant currency terms. Operating margins improved by 60 basis points to 26.4%, beating analyst estimates.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'results', companyTickers: ['TCS'], sectorNames: ['Information Technology'], daysAgo: 4 },

  // HDFC Bank
  { title: 'HDFC Bank\'s advances grow 15.8% YoY, deposit growth accelerates', summary: 'HDFC Bank reported robust 15.8% year-on-year growth in advances, led by retail loans. Deposit growth also accelerated to 18.2%, easing earlier concerns about the HDFC merger integration.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'results', companyTickers: ['HDFCBANK'], sectorNames: ['Financial Services'], daysAgo: 2 },
  { title: 'HDFC Bank to raise ₹12,000 crore via infrastructure bonds', summary: 'HDFC Bank plans to raise up to ₹12,000 crore through infrastructure bonds to fund long-term infrastructure projects across the country.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'neutral', category: 'corporate-actions', companyTickers: ['HDFCBANK'], sectorNames: ['Financial Services'], daysAgo: 5 },

  // Infosys
  { title: 'Infosys raises FY26 revenue guidance to 4.5-5%, margin guidance maintained', summary: 'Infosys raised its full-year revenue growth guidance to 4.5-5% in constant currency, up from 3.5-4.5% earlier, reflecting improving demand and large deal momentum.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'results', companyTickers: ['INFY'], sectorNames: ['Information Technology'], daysAgo: 3 },
  { title: 'Infosys launches AI-powered platform for enterprise automation', summary: 'Infosys unveiled its new AI-first platform, Infosys Topaz, featuring advanced generative AI capabilities for enterprise automation and decision-making.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'products', companyTickers: ['INFY'], sectorNames: ['Information Technology'], daysAgo: 6 },

  // ICICI Bank
  { title: 'ICICI Bank reports 18% rise in Q1 net profit, asset quality stable', summary: 'ICICI Bank posted an 18% year-on-year increase in standalone net profit for Q1, driven by strong NII growth and stable asset quality with GNPA at 2.16%.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'results', companyTickers: ['ICICIBANK'], sectorNames: ['Financial Services'], daysAgo: 3 },

  // SBI
  { title: 'SBI Q1 results: Net profit rises 12% on lower provisions', summary: 'State Bank of India reported a 12% increase in net profit for the June quarter, aided by lower provisioning and stable margins despite competitive deposit rates.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['SBIN'], sectorNames: ['Financial Services'], daysAgo: 4 },

  // Airtel
  { title: 'Bharti Airtel 5G coverage reaches 10,000 towns and cities', summary: 'Bharti Airtel announced that its 5G network now covers over 10,000 towns and cities across India, making it one of the widest 5G deployments globally.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'company', companyTickers: ['BHARTIARTL'], sectorNames: ['Telecommunication'], daysAgo: 1 },

  // L&T
  { title: 'L&T bags ₹18,500 crore order from Saudi Arabia for mega infrastructure project', summary: 'Larsen & Toubro secured a significant order worth ₹18,500 crore from Saudi Arabia for a large-scale infrastructure development project, boosting its international order book.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['LT'], sectorNames: ['Construction'], daysAgo: 2 },

  // Bajaj Finance
  { title: 'Bajaj Finance AUM crosses ₹3.5 lakh crore, customer base at 90 million', summary: 'Bajaj Finance reported that its assets under management crossed ₹3.5 lakh crore, with customer franchise growing to 90 million, driven by strong growth in consumer and SME lending.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'results', companyTickers: ['BAJFINANCE'], sectorNames: ['Financial Services'], daysAgo: 5 },

  // M&M
  { title: 'Mahindra XEV 9e and BE 6e electric SUVs receive 50,000 bookings', summary: 'Mahindra & Mahindra reported that its new electric SUVs, the XEV 9e and BE 6e, have received over 50,000 bookings within two months of launch, exceeding expectations.', source: 'Autocar India', sourceUrl: 'https://www.autocarindia.com', sentiment: 'positive', category: 'products', companyTickers: ['M&M'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 3 },

  // Sun Pharma
  { title: 'Sun Pharma receives US FDA approval for new specialty drug', summary: 'Sun Pharmaceutical Industries received US FDA approval for its new specialty dermatology drug, expanding its high-margin specialty portfolio in the US market.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'regulation', companyTickers: ['SUNPHARMA'], sectorNames: ['Pharmaceuticals'], daysAgo: 2 },

  // Titan
  { title: 'Titan reports 21% revenue growth driven by Tanishq\'s strong festive demand', summary: 'Titan Company posted 21% revenue growth in Q1, primarily driven by its jewellery division Tanishq which reported robust same-store growth and higher buyer conversions.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['TITAN'], sectorNames: ['Consumer Durables'], daysAgo: 4 },

  // Tata Motors
  { title: 'Tata Motors: JLR order book exceeds £30 billion, EV range expansion planned', summary: 'Jaguar Land Rover reported an order book of over £30 billion with strong demand for Range Rover and Defender. The company plans to launch 6 new EV models by 2027.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'company', companyTickers: ['TATAMOTORS'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 3 },

  // HCL Tech
  { title: 'HCL Tech signs strategic partnership with Google Cloud for AI services', summary: 'HCL Technologies announced a strategic partnership with Google Cloud to deliver AI-powered enterprise solutions, combining HCL\'s engineering capabilities with Google\'s AI platform.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['HCLTECH'], sectorNames: ['Information Technology'], daysAgo: 5 },

  // NTPC
  { title: 'NTPC Green Energy plans ₹50,000 crore investment in solar and wind capacity', summary: 'NTPC\'s green energy subsidiary announced plans to invest ₹50,000 crore over the next five years to add 25 GW of renewable energy capacity including solar, wind, and hybrid projects.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'company', companyTickers: ['NTPC'], sectorNames: ['Power'], daysAgo: 4 },

  // Asian Paints
  { title: 'Asian Paints faces margin pressure from crude oil volatility', summary: 'Asian Paints reported a 120 basis point decline in gross margins due to rising crude oil derivative prices, though volume growth remained healthy at 9% year-on-year.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'negative', category: 'results', companyTickers: ['ASIANPAINT'], sectorNames: ['Consumer Durables'], daysAgo: 6 },

  // JSW Steel
  { title: 'JSW Steel crude steel production rises 8% to 7.2 MT in Q1', summary: 'JSW Steel reported an 8% year-on-year increase in crude steel production to 7.2 million tonnes in Q1 FY26, driven by improved capacity utilisation and debottlenecking.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['JSWSTEEL'], sectorNames: ['Metals & Mining'], daysAgo: 5 },

  // Adani Ports
  { title: 'Adani Ports cargo volume up 12% in Q1, guided by Colombo terminal ramp-up', summary: 'Adani Ports and Special Economic Zone reported a 12% year-on-year growth in cargo volumes, supported by the ramp-up of operations at Colombo West International Terminal.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'results', companyTickers: ['ADANIPORTS'], sectorNames: ['Services'], daysAgo: 6 },

  // Dr. Reddy's
  { title: 'Dr. Reddy\'s acquires select brands from major pharma company for ₹1,600 crore', summary: 'Dr. Reddy\'s Laboratories completed the acquisition of a portfolio of established brands worth ₹1,600 crore, strengthening its domestic formulations business in key therapeutic areas.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'mna', companyTickers: ['DRREDDY'], sectorNames: ['Pharmaceuticals'], daysAgo: 4 },

  // Coal India
  { title: 'Coal India production target raised to 850 MT for FY26', summary: 'Coal India Ltd has raised its production target to 850 million tonnes for FY26, up from 780 MT last year, as thermal power demand remains strong across the country.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'company', companyTickers: ['COALINDIA'], sectorNames: ['Oil, Gas & Consumable Fuels'], daysAgo: 7 },

  // Tata Steel
  { title: 'Tata Steel UK operations get £500 million government support for green transition', summary: 'The UK government announced £500 million in support for Tata Steel\'s Port Talbot operations to build an electric arc furnace, as part of the transition to green steelmaking.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'regulation', companyTickers: ['TATASTEEL'], sectorNames: ['Metals & Mining'], daysAgo: 5 },

  // Apollo Hospitals
  { title: 'Apollo Hospitals expands digital health platform Apollo 24|7, crosses 100M users', summary: 'Apollo Hospitals\' digital health platform Apollo 24|7 crossed 100 million registered users, with online pharmacy and teleconsultation revenues growing significantly.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'products', companyTickers: ['APOLLOHOSP'], sectorNames: ['Healthcare Services'], daysAgo: 3 },

  // BEL
  { title: 'BEL secures ₹8,200 crore defence orders in Q1, order book at ₹76,000 crore', summary: 'Bharat Electronics Limited secured new orders worth ₹8,200 crore in Q1, taking its total order book to ₹76,000 crore. Key orders include radar systems and electronic warfare equipment.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['BEL'], sectorNames: ['Capital Goods'], daysAgo: 2 },

  // Maruti
  { title: 'Maruti Suzuki launches new e-Vitara electric SUV, priced from ₹17.49 lakh', summary: 'Maruti Suzuki launched its first electric vehicle, the e-Vitara, at a starting price of ₹17.49 lakh. The vehicle offers a range of up to 500 km and is manufactured at the Gujarat plant.', source: 'Autocar India', sourceUrl: 'https://www.autocarindia.com', sentiment: 'positive', category: 'products', companyTickers: ['MARUTI'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 1 },

  // Wipro
  { title: 'Wipro AI deal bookings double as enterprises accelerate AI adoption', summary: 'Wipro reported that its AI and generative AI-related deal bookings doubled year-on-year, as enterprise customers increasingly seek partners for AI transformation initiatives.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'company', companyTickers: ['WIPRO'], sectorNames: ['Information Technology'], daysAgo: 4 },

  // ITC
  { title: 'ITC hotel demerger gets NCLT approval, new entity to list separately', summary: 'ITC received NCLT approval for the demerger of its hotels business into a separate listed entity, ITC Hotels Ltd, which is expected to be operational by next quarter.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'corporate-actions', companyTickers: ['ITC'], sectorNames: ['Fast Moving Consumer Goods', 'Consumer Services'], daysAgo: 2 },

  // HUL
  { title: 'HUL volume growth returns to double digits at 10% in Q1', summary: 'Hindustan Unilever reported a return to double-digit volume growth at 10% in Q1, driven by rural recovery and successful premium product launches across categories.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'results', companyTickers: ['HINDUNILVR'], sectorNames: ['Fast Moving Consumer Goods'], daysAgo: 5 },

  // Sector news
  { title: 'IT sector sees uptick in deal pipeline as BFSI clients resume spending', summary: 'Indian IT companies are seeing an improvement in deal pipeline, particularly from banking and financial services clients in the US and Europe who had paused spending.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'analyst', companyTickers: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'], sectorNames: ['Information Technology'], daysAgo: 3 },
  { title: 'Auto sector: EV penetration in India expected to reach 15% by 2027', summary: 'Industry body SIAM projects that electric vehicle penetration in India will reach 15% of total vehicle sales by 2027, driven by government subsidies, improving infrastructure, and new model launches.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'analyst', companyTickers: ['TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 6 },
  { title: 'Pharma sector benefits from US generic drug pricing stabilisation', summary: 'Indian pharmaceutical companies are benefiting from stabilisation in US generic drug pricing after years of erosion, leading to improved margin outlook for the sector.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'analyst', companyTickers: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB'], sectorNames: ['Pharmaceuticals'], daysAgo: 7 },
  { title: 'Banking sector NPAs at decade-low, credit growth remains strong', summary: 'The Indian banking sector\'s gross NPA ratio fell to a decade-low of 2.8% in Q1 FY26, while credit growth remained robust at 15.4%, driven by retail and MSME lending.', source: 'RBI Monthly Bulletin', sourceUrl: 'https://www.rbi.org.in', sentiment: 'positive', category: 'regulation', companyTickers: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'KOTAKBANK', 'AXISBANK', 'INDUSINDBK'], sectorNames: ['Financial Services'], daysAgo: 4 },
  { title: 'Steel prices under pressure as China increases exports', summary: 'Domestic steel prices are facing headwinds as China ramps up steel exports amid weak domestic demand, impacting margins of Indian steel producers.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'negative', category: 'analyst', companyTickers: ['JSWSTEEL', 'TATASTEEL', 'HINDALCO'], sectorNames: ['Metals & Mining'], daysAgo: 2 },

  // Additional news for diversity
  { title: 'Kotak Mahindra Bank gets new MD & CEO approval from RBI', summary: 'The Reserve Bank of India approved the appointment of Ashok Vaswani as the new Managing Director & CEO of Kotak Mahindra Bank for a period of three years.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'neutral', category: 'management', companyTickers: ['KOTAKBANK'], sectorNames: ['Financial Services'], daysAgo: 8 },
  { title: 'Adani Enterprises wins ₹26,000 crore copper smelter project approval', summary: 'Adani Enterprises received environmental clearance for its ₹26,000 crore greenfield copper smelter project in Gujarat, which will be India\'s largest.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['ADANIENT'], sectorNames: ['Diversified', 'Metals & Mining'], daysAgo: 3 },
  { title: 'UltraTech Cement acquires India Cements in ₹8,000 crore deal', summary: 'UltraTech Cement completed the acquisition of India Cements for approximately ₹8,000 crore, consolidating its position as India\'s largest cement manufacturer with total capacity reaching 180 MTPA.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'mna', companyTickers: ['ULTRACEMCO'], sectorNames: ['Construction'], daysAgo: 7 },
  { title: 'Hero MotoCorp enters electric scooter segment with VIDA V2', summary: 'Hero MotoCorp launched the VIDA V2 electric scooter at a competitive price of ₹96,000, targeting the mass market segment with a range of 165 km.', source: 'Autocar India', sourceUrl: 'https://www.autocarindia.com', sentiment: 'positive', category: 'products', companyTickers: ['HEROMOTOCO'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 5 },
  { title: 'Power Grid commissions ₹4,500 crore inter-state transmission project', summary: 'Power Grid Corporation commissioned a major inter-state transmission project worth ₹4,500 crore connecting renewable energy zones in Rajasthan to demand centres in northern India.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'company', companyTickers: ['POWERGRID'], sectorNames: ['Power'], daysAgo: 6 },
  { title: 'Cipla launches biosimilar Bevacizumab in India, targets oncology market', summary: 'Cipla launched its biosimilar version of Bevacizumab for cancer treatment in India at a significantly lower cost, expanding access to affordable oncology treatments.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'products', companyTickers: ['CIPLA'], sectorNames: ['Pharmaceuticals'], daysAgo: 4 },
  { title: 'ONGC discovers high-quality oil reserves in Krishna-Godavari basin', summary: 'ONGC announced a significant oil discovery in the Krishna-Godavari deepwater basin, with estimated reserves of 200 million barrels, potentially boosting India\'s domestic oil production.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'company', companyTickers: ['ONGC'], sectorNames: ['Oil, Gas & Consumable Fuels'], daysAgo: 6 },
  { title: 'Britannia enters adjacent food categories, launches frozen snacks range', summary: 'Britannia Industries expanded into the frozen snacks category with a new range of products, as part of its strategy to become a total foods company.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'products', companyTickers: ['BRITANNIA'], sectorNames: ['Fast Moving Consumer Goods'], daysAgo: 7 },
  { title: 'BPCL plans ₹1.4 lakh crore investment in petrochemicals and green energy', summary: 'Bharat Petroleum Corporation announced plans to invest ₹1.4 lakh crore over the next five years, focusing on petrochemical integration and green energy transition.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'company', companyTickers: ['BPCL'], sectorNames: ['Oil, Gas & Consumable Fuels'], daysAgo: 8 },
  { title: 'Eicher Motors: Royal Enfield overseas sales cross 1 lakh units in FY25', summary: 'Royal Enfield achieved a milestone of over 1 lakh international sales in FY25, driven by strong demand in Europe, Southeast Asia, and Latin America.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['EICHERMOT'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 5 },
  { title: 'Nestle India launches 15 new products in Q1, innovation revenue rises', summary: 'Nestle India launched 15 new products in Q1, with innovation-led revenue contribution rising to 4.5% of total sales, driven by health and wellness product categories.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'products', companyTickers: ['NESTLEIND'], sectorNames: ['Fast Moving Consumer Goods'], daysAgo: 3 },
  { title: 'Grasim Industries paints division VSF growth exceeds expectations', summary: 'Grasim Industries reported that its paints division has started operations ahead of schedule, while VSF business margins improved significantly due to lower input costs.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'results', companyTickers: ['GRASIM'], sectorNames: ['Diversified'], daysAgo: 7 },
  { title: 'IndusInd Bank management addresses derivative accounting issue, stabilises operations', summary: 'IndusInd Bank\'s new management team provided clarity on the derivative accounting discrepancy, outlining remediation steps and reaffirming the bank\'s capital adequacy.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'neutral', category: 'management', companyTickers: ['INDUSINDBK'], sectorNames: ['Financial Services'], daysAgo: 6 },
  { title: 'SEBI proposes new framework for mutual fund lite regulations', summary: 'The Securities and Exchange Board of India proposed a new regulatory framework for passively managed mutual funds with simplified compliance requirements.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'neutral', category: 'regulation', companyTickers: [], sectorNames: ['Financial Services'], daysAgo: 2 },
  { title: 'Tech Mahindra turnaround gains momentum, margins improve 200bps', summary: 'Tech Mahindra\'s turnaround strategy under CEO Mohit Joshi showed results with operating margins improving by 200 basis points year-on-year, driven by cost optimisation and deal quality improvement.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['TECHM'], sectorNames: ['Information Technology'], daysAgo: 4 },
  { title: 'Shriram Finance AUM growth at 18%, vehicle finance demand robust', summary: 'Shriram Finance reported 18% AUM growth driven by strong demand for pre-owned commercial vehicle financing and expansion into new product categories.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'results', companyTickers: ['SHRIRAMFIN'], sectorNames: ['Financial Services'], daysAgo: 5 },
  { title: 'HDFC Life and SBI Life see 20%+ growth in new business premium', summary: 'Both HDFC Life and SBI Life Insurance reported over 20% growth in new business premium in Q1, driven by protection and annuity product segments.', source: 'Economic Times', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'results', companyTickers: ['HDFCLIFE', 'SBILIFE'], sectorNames: ['Financial Services'], daysAgo: 3 },
  { title: 'Divi\'s Laboratories signs CDMO contracts worth $500 million with global pharma', summary: 'Divi\'s Laboratories signed multi-year contract development and manufacturing (CDMO) agreements worth $500 million with two global pharmaceutical companies.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'company', companyTickers: ['DIVISLAB'], sectorNames: ['Pharmaceuticals'], daysAgo: 8 },
  { title: 'Bajaj Auto three-wheeler exports surge 35% on Africa and LATAM demand', summary: 'Bajaj Auto reported a 35% surge in three-wheeler exports, led by strong demand from Africa and Latin American markets for its RE and Maxima range.', source: 'Business Standard', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'results', companyTickers: ['BAJAJ-AUTO'], sectorNames: ['Automobiles & Auto Components'], daysAgo: 6 },
  { title: 'Tata Consumer Products acquires Capital Foods and Organic India', summary: 'Tata Consumer Products completed the acquisitions of Capital Foods (Ching\'s Secret, Smith & Jones) and Organic India, significantly expanding its food portfolio.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'mna', companyTickers: ['TATACONSUM'], sectorNames: ['Fast Moving Consumer Goods'], daysAgo: 9 },
  { title: 'Axis Bank digital banking users cross 50 million, UPI transactions soar', summary: 'Axis Bank\'s digital banking platform crossed 50 million registered users, with UPI transactions growing 45% year-on-year, reflecting the bank\'s digital transformation efforts.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'company', companyTickers: ['AXISBANK'], sectorNames: ['Financial Services'], daysAgo: 4 },
  // Deal Radar & Rumour Stories
  { title: 'Tata Electronics in advanced talks to acquire Pegatron Chennai iPhone plant: Sources say', summary: 'Tata Group is nearing a deal to buy a majority stake in Pegatron\'s only iPhone manufacturing facility near Chennai, marking Tata\'s second major Apple assembly acquisition in India.', source: 'Economic Times Deal Desk', sourceUrl: 'https://economictimes.indiatimes.com', sentiment: 'positive', category: 'deals-rumours', companyTickers: ['TCS'], sectorNames: ['Information Technology'], daysAgo: 1 },
  { title: 'Reliance and Disney seal $8.5 billion Indian media joint venture after CCI clearance', summary: 'Reliance Industries and The Walt Disney Company have concluded their blockbuster mega-merger creating India\'s largest entertainment conglomerate with over 120 TV channels and 2 streaming apps.', source: 'LiveMint', sourceUrl: 'https://www.livemint.com', sentiment: 'positive', category: 'mna', companyTickers: ['RELIANCE'], sectorNames: ['Oil, Gas & Consumable Fuels'], daysAgo: 2 },
  { title: 'Adani Ambuja Cements completes acquisition of Penna Cement for ₹10,420 crore', summary: 'Ambuja Cements has completed the 100% acquisition of Penna Cement Industries, adding 14 MTPA capacity and accelerating Adani\'s goal towards 140 MTPA by 2028.', source: 'NDTV Profit', sourceUrl: 'https://www.ndtvprofit.com', sentiment: 'positive', category: 'mna', companyTickers: ['ADANIENT'], sectorNames: ['Services'], daysAgo: 3 },
  { title: 'HDFC Bank board approves stake sale and ₹10,000 crore IPO of HDB Financial Services', summary: 'HDFC Bank has given in-principle approval to initiate the public listing process of its NBFC subsidiary HDB Financial Services to meet RBI scale-based regulatory mandates.', source: 'Moneycontrol', sourceUrl: 'https://www.moneycontrol.com', sentiment: 'positive', category: 'deals-rumours', companyTickers: ['HDFCBANK'], sectorNames: ['Financial Services'], daysAgo: 2 },
  { title: 'Clarification on media report: TCS refutes rumors of dispute on UK contract', summary: 'In a formal disclosure to NSE under SEBI LODR Regulation 30(11), Tata Consultancy Services clarified that media reports alleging cancellation of its £1.5B UK pension scheme contract are baseless.', source: 'NSE Corporate Announcements', sourceUrl: 'https://www.nseindia.com', sentiment: 'neutral', category: 'clarifications', companyTickers: ['TCS'], sectorNames: ['Information Technology'], daysAgo: 1 },
  { title: 'L&T in talks with European energy majors for green hydrogen electrolyser joint venture', summary: 'Larsen & Toubro is exploring a multi-million dollar technology and manufacturing partnership for gigawatt-scale alkaline and PEM electrolysers at its Hazira facility.', source: 'Business Standard Deal Desk', sourceUrl: 'https://www.business-standard.com', sentiment: 'positive', category: 'deals-rumours', companyTickers: ['LT'], sectorNames: ['Construction'], daysAgo: 3 },
];

// ============================================================
// BUILD AND WRITE DATABASE
// ============================================================
function getCompanyIdByTicker(ticker: string): number | undefined {
  const company = companiesArr.find(c => c.ticker === ticker);
  return company?.id;
}

function getSectorIdByName(name: string): number | undefined {
  const sector = sectors.find(s => s.name === name);
  return sector?.id;
}

const newsArticlesArr: DbSchema['newsArticles'] = [];
const articleCompaniesArr: DbSchema['articleCompanies'] = [];
const articleSectorsArr: DbSchema['articleSectors'] = [];

let articleId = 1;
let acId = 1;
let asId = 1;

void sampleNews; // retained only as historical fixture; never written to runtime data
for (const article of [] as SeedArticle[]) {
  newsArticlesArr.push({
    id: articleId,
    title: article.title,
    summary: article.summary,
    source: article.source,
    sourceUrl: article.sourceUrl,
    publishedAt: daysAgo(article.daysAgo),
    imageUrl: null,
    sentiment: article.sentiment,
    category: article.category,
    createdAt: new Date().toISOString(),
  });

  for (const ticker of article.companyTickers) {
    const cid = getCompanyIdByTicker(ticker);
    if (cid) {
      articleCompaniesArr.push({ id: acId++, articleId, companyId: cid, relevanceScore: 1.0 });
    }
  }

  for (const sectorName of article.sectorNames) {
    const sid = getSectorIdByName(sectorName);
    if (sid) {
      articleSectorsArr.push({ id: asId++, articleId, sectorId: sid, relevanceScore: 1.0 });
    }
  }

  articleId++;
}

// Write everything
const dbData: DbSchema = {
  companies: companiesArr,
  sectors,
  newsArticles: newsArticlesArr,
  articleCompanies: articleCompaniesArr,
  articleSectors: articleSectorsArr,
  watchlists: [],
  watchlistCompanies: [],
  users: [],
};

db.writeAll(dbData);

console.log(`✅ Seeded database:`);
console.log(`   ${dbData.companies.length} companies`);
console.log(`   ${dbData.sectors.length} sectors`);
console.log(`   ${dbData.newsArticles.length} news articles`);
console.log(`   ${dbData.articleCompanies.length} article-company relations`);
console.log(`   ${dbData.articleSectors.length} article-sector relations`);
console.log(`   ${dbData.watchlists.length} watchlist(s)`);
console.log(`   ${dbData.watchlistCompanies.length} watchlist-company entries`);
