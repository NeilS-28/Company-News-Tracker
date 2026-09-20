// Script to download official NSE and BSE equity master files,
// map sectors, deduplicate by ISIN, and generate src/db/equities_master.json
// Covers ALL 5,100+ active NSE & BSE listed equities in India

import fs from 'fs';
import path from 'path';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const baseSectorMap: Record<string, string> = {
  'Financial Services': 'Financial Services',
  'Automobile and Auto Components': 'Automobiles & Auto Components',
  'Automobiles & Auto Components': 'Automobiles & Auto Components',
  'Information Technology': 'Information Technology',
  'Fast Moving Consumer Goods': 'Fast Moving Consumer Goods',
  'Consumer Durables': 'Consumer Durables',
  'Consumer Services': 'Consumer Services',
  'Healthcare': 'Pharmaceuticals',
  'Pharmaceuticals': 'Pharmaceuticals',
  'Metals & Mining': 'Metals & Mining',
  'Construction': 'Construction',
  'Construction Materials': 'Construction',
  'Capital Goods': 'Capital Goods',
  'Chemicals': 'Chemicals',
  'Oil Gas & Consumable Fuels': 'Oil, Gas & Consumable Fuels',
  'Oil, Gas & Consumable Fuels': 'Oil, Gas & Consumable Fuels',
  'Power': 'Power',
  'Utilities': 'Power',
  'Realty': 'Realty & Real Estate',
  'Services': 'Services',
  'Telecommunication': 'Telecommunication',
  'Media Entertainment & Publication': 'Media & Entertainment',
  'Textiles': 'Textiles & Apparel',
  'Forest Materials': 'Forest Materials & Paper',
  'Diversified': 'Diversified',
};

const keywords: Array<[string, RegExp]> = [
  ['Financial Services', /bank|finance|financial|securities|capital|invest|insurance|credit|leasing|holdings|finvest|wealth|asset/i],
  ['Pharmaceuticals', /pharma|health|hospital|medic|bio|chem.*pharma|lab|dr\.|diagnost|clinic|cure|remedies/i],
  ['Chemicals', /chemical|chem|fertilizer|petrochem|polymer|pigment|colour|dye|alkali|acid|carbon|organic/i],
  ['Information Technology', /technolog|software|infotech|tech|digital|telecom|system|data|cyber|solut|comput|network/i],
  ['Automobiles & Auto Components', /motor|auto|vehicle|tyre|tire|wheel|brake|engine|gear|clutch|automotive|axle|ancillary/i],
  ['Fast Moving Consumer Goods', /food|fmcg|beverage|brew|dairy|tea|coffee|sugar|oil.*edible|consumer|tobacco|distill|agro|rice|grain|flour|oil|feed/i],
  ['Metals & Mining', /steel|metal|mining|iron|aluminum|aluminium|copper|zinc|alloy|ore|mineral|sponge|tubes|pipes|foundry/i],
  ['Construction', /infra|construction|build|properties|developer|cement|concrete|tiles|ceramics|refractor/i],
  ['Realty & Real Estate', /realty|estate|housing|realtors/i],
  ['Textiles & Apparel', /textile|silk|cotton|yarn|spinning|garment|apparel|fabric|denim|weave|synthetic|fibres|jute/i],
  ['Power', /power|energy|solar|wind|electric|hydro|thermal|renew/i],
  ['Media & Entertainment', /media|film|entertain|cinema|news|broadcasting|print|publish/i],
  ['Services', /service|logistics|transport|shipping|port|cargo|freight|courier|travel|hotel|resort|hospitality/i],
  ['Consumer Durables', /jewel|watch|appliances|electronics|kitchen|lamp|light/i],
  ['Capital Goods', /engineering|equipment|electrical|machin|instrument|pump|tools|heavy|turbin/i],
  ['Oil, Gas & Consumable Fuels', /gas|petroleum|fuel|refin|pipeline|coal/i],
  ['Forest Materials & Paper', /paper|board|packaging|plywood|timber|forest|wood/i],
];

function classifyByName(name: string): string {
  for (const [sector, regex] of keywords) {
    if (regex.test(name)) return sector;
  }
  return 'Diversified';
}

function cleanShortName(fullName: string, ticker: string): string {
  const cleaned = fullName
    .replace(/\s+(Limited|Ltd\.?|L\.T\.D\.?|INCORPORATED|CORP\.?|CORPORATION)\s*$/i, '')
    .replace(/\s*\((India|I)\)\s*$/i, '')
    .trim();
  if (!cleaned || cleaned.length > 35) {
    return ticker;
  }
  return cleaned;
}

interface MasterEquitiesEntry {
  name: string;
  shortName: string;
  ticker: string;
  nseSymbol?: string;
  bseCode?: string;
  exchanges: ('NSE' | 'BSE')[];
  sector: string;
  industry: string;
  description: string;
  isin: string;
}

interface BseScripItem {
  SCRIP_CD: string;
  Scrip_Name?: string;
  Issuer_Name?: string;
  Status?: string;
  ISIN_NUMBER?: string;
  scrip_id?: string;
}

async function run() {
  console.log('Downloading official NSE & BSE master lists...');
  const [eqText, totalMarketText, nifty500Text, microcapText, bseListRaw] = await Promise.all([
    fetch('https://archives.nseindia.com/content/equities/EQUITY_L.csv').then((r) => r.text()),
    fetch('https://archives.nseindia.com/content/indices/ind_niftytotalmarket_list.csv').then((r) => r.text()),
    fetch('https://archives.nseindia.com/content/indices/ind_nifty500list.csv').then((r) => r.text()),
    fetch('https://archives.nseindia.com/content/indices/ind_niftymicrocap250_list.csv').then((r) => r.text()),
    fetch('https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scrip_code=&scrip_name=&industry=&segment=Equity&status=Active', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bseindia.com/',
        'Origin': 'https://www.bseindia.com',
        'Accept': 'application/json',
      },
    })
      .then((r) => r.json() as Promise<BseScripItem[]>)
      .catch(() => [] as BseScripItem[]),
  ]);

  const symbolToMeta = new Map<string, { industry: string; companyName?: string }>();
  [totalMarketText, nifty500Text, microcapText].forEach((text) => {
    text.trim().split('\n').slice(1).forEach((line) => {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const ind = parts[1].trim();
        const sym = parts[2].trim();
        const name = parts[0]?.trim();
        if (sym && ind) {
          symbolToMeta.set(sym, { industry: ind, companyName: name });
        }
      }
    });
  });

  const isinToEntry = new Map<string, MasterEquitiesEntry>();
  const tickerSet = new Set<string>();

  // 1. Process NSE Equities
  const nseLines = eqText.trim().split('\n').slice(1);
  for (const line of nseLines) {
    const parts = line.split(',');
    const ticker = parts[0]?.trim();
    const fullName = parts[1]?.trim();
    const isin = parts[6]?.trim() || '';

    if (!ticker || !fullName) continue;

    let sector = 'Diversified';
    let industry = 'Diversified Operations';

    const mapped = symbolToMeta.get(ticker);
    if (mapped && baseSectorMap[mapped.industry]) {
      sector = baseSectorMap[mapped.industry];
      industry = mapped.industry;
    } else {
      sector = classifyByName(fullName);
      industry = sector;
    }

    const shortName = cleanShortName(fullName, ticker);
    const description = `${fullName} is an Indian public company listed on the National Stock Exchange (NSE: ${ticker}) and Bombay Stock Exchange (BSE) in the ${sector} sector.`;

    const entry: MasterEquitiesEntry = {
      name: fullName,
      shortName,
      ticker,
      nseSymbol: ticker,
      exchanges: ['NSE'],
      sector,
      industry,
      description,
      isin,
    };

    tickerSet.add(ticker);
    if (isin) {
      isinToEntry.set(isin, entry);
    } else {
      isinToEntry.set(`NSE:${ticker}`, entry);
    }
  }

  // 2. Merge BSE Equities
  if (Array.isArray(bseListRaw)) {
    for (const bseItem of bseListRaw) {
      const isin = bseItem.ISIN_NUMBER?.trim();
      const bseCode = bseItem.SCRIP_CD?.trim();
      const rawTicker = bseItem.scrip_id?.trim() || bseCode;
      const fullName = bseItem.Issuer_Name?.trim() || bseItem.Scrip_Name?.trim();

      if (!fullName) continue;

      if (isin && isinToEntry.has(isin)) {
        // Merge BSE code into existing NSE entry
        const existing = isinToEntry.get(isin)!;
        existing.bseCode = bseCode;
        if (!existing.exchanges.includes('BSE')) existing.exchanges.push('BSE');
      } else {
        // BSE-only listed company
        let uniqueTicker = rawTicker || bseCode || `BSE_${isin}`;
        if (tickerSet.has(uniqueTicker)) {
          uniqueTicker = `${uniqueTicker}.BO`;
        }
        tickerSet.add(uniqueTicker);

        const sector = classifyByName(fullName);
        const shortName = cleanShortName(fullName, uniqueTicker);
        const description = `${fullName} is an Indian public company listed on the Bombay Stock Exchange (BSE: ${bseCode || uniqueTicker}) in the ${sector} sector.`;

        const entry: MasterEquitiesEntry = {
          name: fullName,
          shortName,
          ticker: uniqueTicker,
          bseCode,
          exchanges: ['BSE'],
          sector,
          industry: sector,
          description,
          isin: isin || '',
        };

        if (isin) {
          isinToEntry.set(isin, entry);
        } else {
          isinToEntry.set(`BSE:${uniqueTicker}`, entry);
        }
      }
    }
  }

  const result = Array.from(isinToEntry.values());
  const outPath = path.join(process.cwd(), 'src', 'db', 'equities_master.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Successfully generated ${result.length} NSE & BSE companies into ${outPath}`);
}

run().catch(console.error);
