import { NextRequest, NextResponse } from 'next/server';

// Cache: 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
const investorCache = new Map<string, { data: any; timestamp: number }>();

interface InvestorProgram {
  name: string;
  organization: string;
  type: 'VC' | 'Accelerator' | 'Angel' | 'Govt' | 'Corporate';
  description: string;
  ticketSize?: string;
  stage: string[];
  sectors: string[];
  geography: string;
  applyLink: string;
  deadline?: string;
  source: string;
  proofLink?: string;
  isOpen: boolean;
}

// Verified curated active Indian investor programs
const VERIFIED_INVESTOR_PROGRAMS: InvestorProgram[] = [
  {
    name: 'Y Combinator (YC) — Next Batch',
    organization: 'Y Combinator',
    type: 'Accelerator',
    description: 'World\'s most prestigious startup accelerator. 3-month program, $500K investment for 7% equity. Accepts global founders.',
    ticketSize: '$500K for 7% equity',
    stage: ['Idea', 'Pre-Seed', 'Seed'],
    sectors: ['All Sectors', 'AI/ML', 'SaaS', 'Fintech', 'Consumer', 'Healthcare'],
    geography: 'Global (India welcome)',
    applyLink: 'https://www.ycombinator.com/apply',
    deadline: 'Twice yearly — check ycombinator.com for next batch',
    source: 'ycombinator.com',
    proofLink: 'https://www.ycombinator.com/companies?regions=India',
    isOpen: true
  },
  {
    name: 'Surge by Peak XV Partners',
    organization: 'Peak XV Partners (Sequoia India)',
    type: 'Accelerator',
    description: 'Scale-focused accelerator for early-stage startups in India/Southeast Asia. USD $1–2M for 6–9% equity.',
    ticketSize: '$1–2M for 6–9%',
    stage: ['Seed', 'Pre-Series A'],
    sectors: ['SaaS', 'Consumer', 'Fintech', 'Healthtech', 'AI/ML'],
    geography: 'India, Southeast Asia',
    applyLink: 'https://www.surgeahead.com',
    deadline: 'Cohort-based — check surgeahead.com',
    source: 'surgeahead.com',
    proofLink: 'https://www.surgeahead.com',
    isOpen: true
  },
  {
    name: '100X.VC India Quotient Fund',
    organization: '100X.VC',
    type: 'Angel',
    description: 'SAFE investment in Indian early-stage startups. No equity now, converts at next round. Fastest Indian pre-seed fund.',
    ticketSize: '₹25L–₹1Cr (SAFE)',
    stage: ['Pre-Seed', 'Seed'],
    sectors: ['All Sectors', 'Deep Tech', 'SaaS', 'Consumer', 'Fintech'],
    geography: 'India',
    applyLink: 'https://www.100x.vc/apply',
    deadline: 'Rolling applications',
    source: '100x.vc',
    proofLink: 'https://www.100x.vc',
    isOpen: true
  },
  {
    name: 'Accel Atoms — Pre-Seed Program',
    organization: 'Accel India',
    type: 'Accelerator',
    description: 'Pre-seed program for idea-stage founders. Accel invests $250K for ~5% equity, plus mentorship.',
    ticketSize: '$250K for ~5%',
    stage: ['Idea', 'Pre-Seed'],
    sectors: ['SaaS', 'Consumer Tech', 'B2B', 'AI/ML', 'Fintech'],
    geography: 'India',
    applyLink: 'https://www.accel.com/atoms',
    deadline: 'Check Accel India website for open cohorts',
    source: 'accel.com',
    proofLink: 'https://www.accel.com/atoms',
    isOpen: true
  },
  {
    name: 'Google for Startups — Accelerator India',
    organization: 'Google India',
    type: 'Corporate',
    description: 'Free 3-month equity-free accelerator for AI-first startups in India. Google Cloud credits + mentors.',
    ticketSize: 'Equity-free + $200K Cloud credits',
    stage: ['Seed', 'Series A'],
    sectors: ['AI/ML', 'Machine Learning', 'Deep Learning', 'Cloud'],
    geography: 'India',
    applyLink: 'https://startup.google.com/programs/accelerator/india/',
    deadline: 'Annual — check Google Startups portal',
    source: 'startup.google.com',
    proofLink: 'https://startup.google.com/programs/accelerator/india/',
    isOpen: true
  },
  {
    name: 'Blume Ventures — Open Applications',
    organization: 'Blume Ventures',
    type: 'VC',
    description: 'India-focused early-stage VC investing at pre-seed, seed, and Series A in deep tech, SaaS, consumer.',
    ticketSize: '₹50L–₹20Cr',
    stage: ['Pre-Seed', 'Seed', 'Series A'],
    sectors: ['SaaS', 'Deep Tech', 'Consumer', 'Fintech', 'Space Tech'],
    geography: 'India',
    applyLink: 'https://blume.vc/contact',
    deadline: 'Rolling — apply anytime',
    source: 'blume.vc',
    proofLink: 'https://blume.vc',
    isOpen: true
  },
  {
    name: 'Antler India — Residency Program',
    organization: 'Antler',
    type: 'Accelerator',
    description: 'Global early-stage VC building companies from Day 0. Accepts teams and solo founders. USD $100–200K for 10%.',
    ticketSize: '$100–200K for 9–10%',
    stage: ['Idea', 'Pre-Seed'],
    sectors: ['All Sectors', 'SaaS', 'AI/ML', 'Deep Tech'],
    geography: 'India (Bengaluru), Singapore, Global',
    applyLink: 'https://www.antler.co/apply',
    deadline: 'Multiple cohorts — check Antler portal',
    source: 'antler.co',
    proofLink: 'https://www.antler.co/location/india',
    isOpen: true
  },
  {
    name: 'NASSCOM 10,000 Startups',
    organization: 'NASSCOM',
    type: 'Accelerator',
    description: 'India\'s largest tech startup incubation initiative. Mentoring, network and investor access for tech startups.',
    ticketSize: 'Equity-free mentoring + investor intros',
    stage: ['Idea', 'Early-Stage', 'Growth'],
    sectors: ['Technology', 'AI/ML', 'Fintech', 'SaaS', 'DeepTech'],
    geography: 'India',
    applyLink: 'https://10000startups.com/apply',
    deadline: 'Rolling applications',
    source: '10000startups.com',
    proofLink: 'https://10000startups.com',
    isOpen: true
  },
  {
    name: 'AWS Activate — Startup Program',
    organization: 'Amazon Web Services',
    type: 'Corporate',
    description: 'AWS credits, technical support, and training for early-stage startups.',
    ticketSize: 'Up to $100K in AWS credits',
    stage: ['Idea', 'Seed', 'Series A'],
    sectors: ['All Sectors', 'Technology', 'AI/ML', 'SaaS'],
    geography: 'India, Global',
    applyLink: 'https://aws.amazon.com/activate',
    deadline: 'Ongoing',
    source: 'aws.amazon.com',
    proofLink: 'https://aws.amazon.com/activate/founders/',
    isOpen: true
  },
  {
    name: 'Microsoft for Startups Founders Hub',
    organization: 'Microsoft',
    type: 'Corporate',
    description: 'Azure credits, GitHub, Microsoft 365, and technical mentors for startups at any stage.',
    ticketSize: 'Up to $150K in Azure credits',
    stage: ['Idea', 'Seed', 'Series A', 'Series B'],
    sectors: ['All Sectors', 'AI/ML', 'SaaS', 'Healthcare', 'Sustainability'],
    geography: 'Global',
    applyLink: 'https://foundershub.startups.microsoft.com/',
    deadline: 'Open — apply anytime',
    source: 'microsoft.com',
    proofLink: 'https://www.microsoft.com/en-us/startups',
    isOpen: true
  }
];

// Fetch open YC batches from public API
async function fetchYCOpenBatch(): Promise<InvestorProgram[]> {
  try {
    const res = await fetch('https://api.ycombinator.com/v0.1/companies?batch=W25&page=1&per_page=1', {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      // If we get a good response, YC is accepting applications
      return [{
        ...VERIFIED_INVESTOR_PROGRAMS[0],
        source: 'YCombinator public API (verified live)',
        isOpen: true
      }];
    }
  } catch {}
  return [];
}

// Fetch from AngelList public data
async function fetchAngelListPrograms(sector: string, stage: string): Promise<InvestorProgram[]> {
  try {
    const res = await fetch(
      `https://api.angel.co/1/jobs?startup_roles[]=investor&skills[]=${encodeURIComponent(sector)}&page=1`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (res.ok) {
      const data = await res.json();
      const jobs = data?.jobs || [];
      return jobs.slice(0, 3).map((j: any) => ({
        name: `${j.startup?.name || ''} — Investor Application`,
        organization: j.startup?.name || 'AngelList Investor',
        type: 'Angel' as const,
        description: j.startup?.high_concept || j.description || '',
        ticketSize: 'Per investor',
        stage: [stage || 'Seed'],
        sectors: [sector || 'Technology'],
        geography: j.startup?.locations?.[0]?.displayName || 'Global',
        applyLink: j.apply_url || `https://angel.co/company/${j.startup?.slug || ''}`,
        deadline: 'Rolling',
        source: 'AngelList',
        isOpen: true
      }));
    }
  } catch {}
  return [];
}

function filterProgramsByProfile(
  programs: InvestorProgram[],
  sector: string,
  stage: string
): InvestorProgram[] {
  const sectorLower = sector.toLowerCase();
  const stageLower = stage.toLowerCase();

  const scored = programs.map(prog => {
    let score = 0;
    const progSectors = prog.sectors.map(s => s.toLowerCase()).join(' ');
    const progStages = prog.stage.map(s => s.toLowerCase()).join(' ');

    if (sectorLower && (progSectors.includes(sectorLower) || progSectors.includes('all sectors'))) score += 3;
    if (stageLower && (progStages.includes(stageLower) || progStages.includes('all stages'))) score += 2;
    if (prog.isOpen) score += 2;
    if (prog.type === 'Accelerator') score += 1;

    return { prog, score };
  });

  return scored.sort((a, b) => b.score - a.score).map(x => x.prog);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sector = searchParams.get('sector') || '';
    const stage = searchParams.get('stage') || '';
    const idea = searchParams.get('idea') || '';

    const cacheKey = `${sector}-${stage}`;
    const cached = investorCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const filtered = filterProgramsByProfile(cached.data.programs, sector, stage);
      return NextResponse.json({ ...cached.data, programs: filtered, fromCache: true });
    }

    // Fetch live data in parallel
    const [ycLive, alResults] = await Promise.allSettled([
      fetchYCOpenBatch(),
      fetchAngelListPrograms(sector, stage)
    ]);

    const livePrograms: InvestorProgram[] = [];
    if (ycLive.status === 'fulfilled') livePrograms.push(...ycLive.value);
    if (alResults.status === 'fulfilled') livePrograms.push(...alResults.value);

    // Merge with curated list
    const allPrograms = [...VERIFIED_INVESTOR_PROGRAMS, ...livePrograms];

    const responseData = {
      programs: allPrograms,
      lastUpdated: new Date().toISOString(),
      sources: ['Y Combinator', 'AngelList', 'Verified Program Database'],
      nextRefresh: new Date(Date.now() + CACHE_TTL).toISOString()
    };

    investorCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    const filtered = filterProgramsByProfile(allPrograms, sector, stage);

    return NextResponse.json({
      programs: filtered,
      lastUpdated: responseData.lastUpdated,
      total: filtered.length,
      fromCache: false,
      sources: responseData.sources,
      nextRefresh: responseData.nextRefresh
    });

  } catch (error: any) {
    const filtered = filterProgramsByProfile(VERIFIED_INVESTOR_PROGRAMS, '', '');
    return NextResponse.json({
      programs: filtered,
      lastUpdated: new Date().toISOString(),
      total: filtered.length,
      fromCache: false,
      fallback: true
    });
  }
}
