import { NextRequest, NextResponse } from 'next/server';

// Cache for 2 minutes as requested
const CACHE_TTL = 2 * 60 * 1000;
let cache: { data: any; timestamp: number } | null = null;

interface SchemeResult {
  name: string;
  agency: string;
  description: string;
  amount: string;
  type: 'Grant' | 'Loan' | 'Recognition' | 'Equity' | 'Incubation';
  deadline: string;
  applyLink: string;
  sectors: string[];
  stage: string[];
  eligibility: string;
  source: string;
  verified: boolean;
}

// Curated verified Indian Govt Schemes — from official portals
const VERIFIED_SCHEMES: SchemeResult[] = [
  {
    name: 'Startup India Seed Fund Scheme (SISFS)',
    agency: 'DPIIT, Ministry of Commerce & Industry',
    description: 'Financial assistance for proof of concept, prototype development, product trials, market entry and commercialization.',
    amount: 'Up to ₹20 Lakh (grants) + ₹50 Lakh (debt)',
    type: 'Grant',
    deadline: 'Rolling — apply anytime',
    applyLink: 'https://seedfund.startupindia.gov.in/',
    sectors: ['All Sectors', 'Technology', 'Healthcare', 'Agriculture', 'Manufacturing'],
    stage: ['Idea', 'Prototype', 'Early-Stage'],
    eligibility: 'DPIIT-recognized startup, ≤2 years old, turnover <₹25Cr',
    source: 'seedfund.startupindia.gov.in',
    verified: true
  },
  {
    name: 'NIDHI-Prayas (Proof of Concept Grant)',
    agency: 'Department of Science & Technology (DST)',
    description: 'Supports innovators to transform ideas into prototypes. Equity-free grant for proof of concept.',
    amount: 'Up to ₹10 Lakh',
    type: 'Grant',
    deadline: 'Rolling — check DST portal for batches',
    applyLink: 'https://dst.gov.in/nidhi',
    sectors: ['Deep Tech', 'Science', 'Technology', 'Healthcare', 'Energy'],
    stage: ['Idea', 'Prototype'],
    eligibility: 'Individual innovators, startups at proof-of-concept stage',
    source: 'dst.gov.in',
    verified: true
  },
  {
    name: 'BIRAC BIG (Biotechnology Ignition Grant)',
    agency: 'BIRAC — Biotechnology Industry Research Assistance Council',
    description: 'Ignition grants for biotech startups to validate technology through research.',
    amount: 'Up to ₹50 Lakh',
    type: 'Grant',
    deadline: 'Open calls — check birac.nic.in',
    applyLink: 'https://birac.nic.in/big.php',
    sectors: ['Biotechnology', 'Healthcare', 'Pharma', 'AgriTech', 'BioEnergy'],
    stage: ['Idea', 'Prototype', 'Seed'],
    eligibility: 'Indian startups/entrepreneurs with biotech innovation',
    source: 'birac.nic.in',
    verified: true
  },
  {
    name: 'TIDE 2.0 — MeitY ICT Startup Support',
    agency: 'MeitY — Ministry of Electronics & IT',
    description: 'Equity-free grants for ICT-based startups through MeitY-empanelled incubators. Includes mentoring and technical support.',
    amount: 'Up to ₹75 Lakh per startup',
    type: 'Grant',
    deadline: 'Rolling via 51+ empanelled incubators',
    applyLink: 'https://tide2.meity.gov.in/',
    sectors: ['ICT', 'AI/ML', 'IoT', 'Cybersecurity', 'Healthtech', 'EdTech'],
    stage: ['Idea', 'Prototype', 'Seed'],
    eligibility: 'DPIIT-recognized startups or individuals with ICT-based innovation',
    source: 'tide2.meity.gov.in',
    verified: true
  },
  {
    name: 'SIDBI Fund of Funds for Startups (FFS)',
    agency: 'SIDBI — Small Industries Development Bank of India',
    description: 'Invests in SEBI-registered Alternative Investment Funds (AIFs) that then invest in Indian startups.',
    amount: '₹10,000 Cr corpus — VC equity investments',
    type: 'Equity',
    deadline: 'Ongoing — through registered AIFs',
    applyLink: 'https://www.sidbi.in/en/page/fund-of-funds',
    sectors: ['All Sectors'],
    stage: ['Seed', 'Series A', 'Series B'],
    eligibility: 'DPIIT-recognized startups; investment routed through registered AIFs',
    source: 'sidbi.in',
    verified: true
  },
  {
    name: 'DPIIT Recognition + Tax Exemption (Sec 80-IAC)',
    agency: 'DPIIT — Department for Promotion of Industry & Internal Trade',
    description: '100% tax holiday on profits for 3 consecutive years (out of first 10 years), plus exemption from angel tax.',
    amount: '100% income tax exemption for 3 years',
    type: 'Recognition',
    deadline: 'Apply anytime after incorporation',
    applyLink: 'https://www.nsws.gov.in',
    sectors: ['All Sectors'],
    stage: ['Seed', 'Early-Stage', 'Growth'],
    eligibility: 'Incorporated startup with innovation/scalable model, turnover <₹100Cr',
    source: 'nsws.gov.in / startupindia.gov.in',
    verified: true
  },
  {
    name: 'Atal Innovation Mission — Atal New India Challenges (ANIC)',
    agency: 'NITI Aayog — Atal Innovation Mission',
    description: 'Challenge-based grants for tech innovation solving national-importance problems.',
    amount: 'Up to ₹1 Crore per challenge winner',
    type: 'Grant',
    deadline: 'Challenge-specific — check aim.gov.in',
    applyLink: 'https://aim.gov.in/anic.php',
    sectors: ['Deep Tech', 'AgriTech', 'HealthTech', 'Education', 'WaterTech', 'Defense'],
    stage: ['Prototype', 'Seed', 'Early-Stage'],
    eligibility: 'Indian startups, innovators, researchers with working prototypes',
    source: 'aim.gov.in',
    verified: true
  },
  {
    name: 'NIDHI-EIR (Entrepreneur in Residence)',
    agency: 'Department of Science & Technology (DST)',
    description: 'Monthly stipend fellowship for first-time tech entrepreneurs building their startup.',
    amount: '₹30,000–₹50,000/month stipend for up to 1 year',
    type: 'Grant',
    deadline: 'Batch-based — check DST/participating incubators',
    applyLink: 'https://nidhi.dst.gov.in/eir',
    sectors: ['Technology', 'Healthcare', 'Agriculture', 'Social Impact'],
    stage: ['Idea', 'Prototype'],
    eligibility: 'Individuals without full-time employment, building tech ventures',
    source: 'nidhi.dst.gov.in',
    verified: true
  },
  {
    name: 'Stand-Up India Scheme',
    agency: 'SIDBI / Ministry of Finance',
    description: 'Bank loans for SC, ST, and women entrepreneurs for greenfield enterprises.',
    amount: '₹10 Lakh to ₹1 Crore (composite loan)',
    type: 'Loan',
    deadline: 'Ongoing',
    applyLink: 'https://www.standupmitra.in/',
    sectors: ['Manufacturing', 'Services', 'Trading'],
    stage: ['Idea', 'Early-Stage'],
    eligibility: 'SC/ST or Women entrepreneurs, first enterprise, age ≥25',
    source: 'standupmitra.in',
    verified: true
  },
  {
    name: 'iCreate — International Centre for Research in Agri & Allied Sectors',
    agency: 'Government of Gujarat / AIM',
    description: 'Incubation and funding support for agri-tech and rural innovation startups.',
    amount: 'Up to ₹25 Lakh in equity-free support',
    type: 'Incubation',
    deadline: 'Rolling — apply via iCreate portal',
    applyLink: 'https://www.icreate.org.in/',
    sectors: ['AgriTech', 'FoodTech', 'Rural Innovation', 'Water'],
    stage: ['Idea', 'Prototype', 'Early-Stage'],
    eligibility: 'Indian startups/innovators in agri-tech and allied domains',
    source: 'icreate.org.in',
    verified: true
  },
  {
    name: 'MSME CLCSS (Credit-Linked Capital Subsidy Scheme)',
    agency: 'Ministry of MSME',
    description: 'Capital subsidy for technology upgradation of micro and small enterprises in manufacturing.',
    amount: '15% subsidy on plant & machinery (max ₹15 Lakh)',
    type: 'Grant',
    deadline: 'Continuous — apply via scheduled bank',
    applyLink: 'https://msme.gov.in/schemes/credit-linked-capital-subsidy-scheme',
    sectors: ['Manufacturing', 'Technology', 'Food Processing', 'Textiles', 'Chemical'],
    stage: ['Early-Stage', 'Growth'],
    eligibility: 'Micro and Small Enterprises as per MSMED Act 2006',
    source: 'msme.gov.in',
    verified: true
  },
  {
    name: 'PM Vishwakarma Yojana',
    agency: 'Ministry of MSME & Ministry of Skill Development',
    description: 'Recognition, financial support and skill training for traditional artisans and craftspeople.',
    amount: '₹1 Lakh (1st collateral-free loan) + ₹2 Lakh (2nd)',
    type: 'Loan',
    deadline: 'Rolling',
    applyLink: 'https://pmvishwakarma.gov.in/',
    sectors: ['Handicrafts', 'Traditional Trades', 'D2C Artisanal'],
    stage: ['Idea', 'Early-Stage'],
    eligibility: 'Artisans in 18 defined traditional trades, age 18+',
    source: 'pmvishwakarma.gov.in',
    verified: true
  }
];

async function fetchStartupIndiaOpportunities(): Promise<SchemeResult[]> {
  try {
    const res = await fetch('https://api.startupindia.gov.in/sih/api/fund/opportunities?page=0&size=5&sort=createdDate,desc', {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; PromptPilot/1.0)' },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      const items = data?.content || data?.data || [];
      return items.slice(0, 5).map((item: any) => ({
        name: item.title || item.name || 'Startup India Opportunity',
        agency: item.organizer || 'Startup India / DPIIT',
        description: (item.description || item.summary || '').substring(0, 300),
        amount: item.amount || item.fundingAmount || 'As per scheme',
        type: 'Grant' as const,
        deadline: item.deadline || item.lastDate || 'Check portal',
        applyLink: item.applyUrl || item.link || 'https://www.startupindia.gov.in/content/sih/en/opportunities/government.html',
        sectors: Array.isArray(item.sectors) ? item.sectors : ['All Sectors'],
        stage: Array.isArray(item.stage) ? item.stage : ['All Stages'],
        eligibility: item.eligibility || 'DPIIT-recognized startups',
        source: 'startupindia.gov.in (live)',
        verified: true
      }));
    }
  } catch {}
  return [];
}

function filterSchemesByProfile(
  schemes: SchemeResult[],
  sector: string,
  stage: string,
  type: string
): SchemeResult[] {
  const sectorLower = sector.toLowerCase();
  const stageLower = stage.toLowerCase();

  const scored = schemes.map(scheme => {
    let score = 0;
    const schemeSectors = scheme.sectors.map(s => s.toLowerCase()).join(' ');
    const schemeStages = scheme.stage.map(s => s.toLowerCase()).join(' ');

    if (sectorLower && (schemeSectors.includes(sectorLower) || schemeSectors.includes('all sectors'))) score += 3;
    else if (sectorLower) score += 0.5; // still show but lower priority

    if (stageLower && (schemeStages.includes(stageLower) || schemeStages.includes('all stages'))) score += 2;
    else if (stageLower) score += 0.5;

    if (scheme.type === 'Recognition') score += 1; // always useful
    if (scheme.verified) score += 1;

    return { scheme, score };
  });

  let result = scored.sort((a, b) => b.score - a.score).map(x => x.scheme);

  if (type && type !== 'all') {
    result = result.filter(s => s.type.toLowerCase() === type.toLowerCase());
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get('sector') || '';
    const stage = searchParams.get('stage') || '';
    const type = searchParams.get('type') || 'all';

    // Check cache (2 minute TTL)
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      const filtered = filterSchemesByProfile(cache.data.schemes, sector, stage, type).slice(0, 5);
      return NextResponse.json({
        schemes: filtered,
        lastUpdated: cache.data.lastUpdated,
        fromCache: true,
        total: filtered.length,
        nextRefresh: new Date(cache.timestamp + CACHE_TTL).toISOString()
      });
    }

    // Fetch live data
    const liveSchemes = await fetchStartupIndiaOpportunities();

    // Merge: live first, then static (deduplicate by name)
    const liveNames = new Set(liveSchemes.map(s => s.name));
    const staticToAdd = VERIFIED_SCHEMES.filter(s => !liveNames.has(s.name));
    const allSchemes = [...liveSchemes, ...staticToAdd];

    const lastUpdated = new Date().toISOString();
    cache = { data: { schemes: allSchemes, lastUpdated }, timestamp: Date.now() };

    const filtered = filterSchemesByProfile(allSchemes, sector, stage, type).slice(0, 5);

    return NextResponse.json({
      schemes: filtered,
      lastUpdated,
      fromCache: false,
      total: filtered.length,
      liveCount: liveSchemes.length,
      staticCount: staticToAdd.length,
      nextRefresh: new Date(Date.now() + CACHE_TTL).toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      schemes: VERIFIED_SCHEMES.slice(0, 5),
      lastUpdated: new Date().toISOString(),
      fromCache: false,
      total: 5,
      fallback: true,
      error: 'Live fetch failed — showing verified database'
    });
  }
}
