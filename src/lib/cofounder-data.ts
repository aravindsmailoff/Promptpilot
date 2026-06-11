// PromptPilot AI Co-Founder — Static Data Library
// Curated database: Indian + US investors, Govt schemes, market benchmarks

export interface InvestorRecord {
  name: string;
  type: 'VC' | 'Angel' | 'Accelerator' | 'CVC';
  geography: 'India' | 'US' | 'Global';
  stages: string[];
  sectors: string[];
  portfolio: string[];
  ticketSize: string;
  website: string;
  email?: string;
}

export interface GovernmentScheme {
  name: string;
  agency: string;
  description: string;
  amount: string;
  eligibility: string[];
  sectors: string[];
  stage: string[];
  deadline: string;
  link: string;
  type: 'Grant' | 'Loan' | 'Equity' | 'Recognition' | 'Incubation';
  state: 'National' | 'State';
}

export interface MarketBenchmark {
  sector: string;
  avgCAC_INR: string;
  avgLTV_INR: string;
  avgChurn: string;
  avgARPU_INR: string;
  growthRate: string;
}

// ──────────────────────────────────────────────
// INVESTORS DATABASE
// ──────────────────────────────────────────────

export const INVESTORS: InvestorRecord[] = [
  // ── Indian VCs ──
  {
    name: 'Peak XV Partners (Sequoia India)',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B', 'Growth'],
    sectors: ['SaaS', 'Fintech', 'Healthtech', 'Consumer', 'AI/ML', 'Edtech'],
    portfolio: ['CRED', 'Meesho', 'BharatPe', 'Groww', 'Unacademy'],
    ticketSize: '₹2Cr – ₹200Cr',
    website: 'https://www.peakxv.com',
    email: 'info@peakxv.com',
  },
  {
    name: 'Accel India',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B'],
    sectors: ['SaaS', 'Fintech', 'Consumer Tech', 'B2B', 'AI/ML'],
    portfolio: ['Flipkart', 'Freshworks', 'Swiggy', 'BlackBuck', 'Zetwerk'],
    ticketSize: '₹1Cr – ₹100Cr',
    website: 'https://www.accel.com/india',
    email: 'india@accel.com',
  },
  {
    name: 'Matrix Partners India',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B'],
    sectors: ['Fintech', 'SaaS', 'Consumer', 'Healthtech', 'Agritech'],
    portfolio: ['OYO', 'Razorpay', 'Dailyhunt', 'Aakash Educational Services'],
    ticketSize: '₹2Cr – ₹80Cr',
    website: 'https://www.matrixpartners.in',
  },
  {
    name: 'Blume Ventures',
    type: 'VC',
    geography: 'India',
    stages: ['Pre-Seed', 'Seed', 'Series A'],
    sectors: ['SaaS', 'Deep Tech', 'Consumer', 'Fintech', 'Space Tech'],
    portfolio: ['Unacademy', 'Slice', 'Dunzo', 'Spinny', 'Purplle'],
    ticketSize: '₹50L – ₹20Cr',
    website: 'https://blume.vc',
  },
  {
    name: 'Kalaari Capital',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B'],
    sectors: ['Consumer Tech', 'Healthtech', 'SaaS', 'D2C', 'Fintech'],
    portfolio: ['Dream11', 'Cure.fit', 'Snapdeal', 'Myntra'],
    ticketSize: '₹1Cr – ₹60Cr',
    website: 'https://www.kalaari.com',
  },
  {
    name: 'Elevation Capital',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B'],
    sectors: ['Fintech', 'Consumer', 'SaaS', 'Healthtech', 'Logistics'],
    portfolio: ['Paytm', 'ShareChat', 'Meesho', 'Urban Company'],
    ticketSize: '₹2Cr – ₹100Cr',
    website: 'https://elevationcapital.com',
  },
  {
    name: 'SAIF Partners (now Elevation)',
    type: 'VC',
    geography: 'India',
    stages: ['Series A', 'Series B', 'Growth'],
    sectors: ['Fintech', 'Consumer', 'Healthcare', 'Logistics'],
    portfolio: ['Justdial', 'MakeMyTrip', 'IndiaMart'],
    ticketSize: '₹5Cr – ₹150Cr',
    website: 'https://elevationcapital.com',
  },
  {
    name: 'Nexus Venture Partners',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B'],
    sectors: ['SaaS', 'AI/ML', 'Fintech', 'Healthcare', 'Consumer'],
    portfolio: ['Delhivery', 'Postman', 'Druva', 'Pubmatic'],
    ticketSize: '₹2Cr – ₹80Cr',
    website: 'https://www.nexusvp.com',
  },
  {
    name: 'Lightspeed India',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A', 'Series B'],
    sectors: ['Consumer Tech', 'Fintech', 'SaaS', 'Healthtech'],
    portfolio: ['Oyo', 'Udaan', 'ShareChat', 'Byju\'s'],
    ticketSize: '₹2Cr – ₹100Cr',
    website: 'https://lsvp.com/india',
  },
  {
    name: '3one4 Capital',
    type: 'VC',
    geography: 'India',
    stages: ['Pre-Seed', 'Seed', 'Series A'],
    sectors: ['Deep Tech', 'SaaS', 'Fintech', 'AI/ML', 'Climate Tech'],
    portfolio: ['Jupiter', 'Darwinbox', 'Licious', 'Open Financial'],
    ticketSize: '₹25L – ₹25Cr',
    website: 'https://3one4.com',
  },
  {
    name: 'India Quotient',
    type: 'VC',
    geography: 'India',
    stages: ['Pre-Seed', 'Seed'],
    sectors: ['Consumer', 'Vernacular Tech', 'Fintech', 'Edtech'],
    portfolio: ['ShareChat', 'Lendingkart', 'Klub'],
    ticketSize: '₹25L – ₹10Cr',
    website: 'https://www.indiaquotient.in',
  },
  {
    name: 'Stellaris Venture Partners',
    type: 'VC',
    geography: 'India',
    stages: ['Seed', 'Series A'],
    sectors: ['SaaS', 'Fintech', 'Consumer Tech', 'AI/ML'],
    portfolio: ['Whatfix', 'Mamaearth', 'mFine'],
    ticketSize: '₹1Cr – ₹30Cr',
    website: 'https://stellarisvp.com',
  },
  // ── US VCs ──
  {
    name: 'Y Combinator',
    type: 'Accelerator',
    geography: 'US',
    stages: ['Pre-Seed', 'Seed'],
    sectors: ['SaaS', 'Fintech', 'AI/ML', 'Biotech', 'Consumer', 'Deep Tech'],
    portfolio: ['Airbnb', 'Stripe', 'Dropbox', 'Reddit', 'Razorpay'],
    ticketSize: '$500K',
    website: 'https://www.ycombinator.com',
    email: 'apply@ycombinator.com',
  },
  {
    name: 'Andreessen Horowitz (a16z)',
    type: 'VC',
    geography: 'US',
    stages: ['Seed', 'Series A', 'Series B', 'Growth'],
    sectors: ['AI/ML', 'Crypto', 'Fintech', 'SaaS', 'Consumer', 'Bio'],
    portfolio: ['Coinbase', 'GitHub', 'Lyft', 'Okta', 'Roblox'],
    ticketSize: '$1M – $100M+',
    website: 'https://a16z.com',
  },
  {
    name: 'Sequoia Capital',
    type: 'VC',
    geography: 'US',
    stages: ['Seed', 'Series A', 'Series B', 'Growth'],
    sectors: ['Technology', 'Healthcare', 'Consumer', 'Financial Services'],
    portfolio: ['Apple', 'Google', 'WhatsApp', 'Zoom', 'Stripe'],
    ticketSize: '$1M – $100M+',
    website: 'https://www.sequoiacap.com',
  },
  {
    name: 'First Round Capital',
    type: 'VC',
    geography: 'US',
    stages: ['Pre-Seed', 'Seed', 'Series A'],
    sectors: ['SaaS', 'Consumer', 'Fintech', 'AI/ML', 'Healthcare'],
    portfolio: ['Uber', 'Square', 'Notion', 'Roblox', 'Warby Parker'],
    ticketSize: '$250K – $5M',
    website: 'https://firstround.com',
  },
  {
    name: 'Benchmark Capital',
    type: 'VC',
    geography: 'US',
    stages: ['Seed', 'Series A'],
    sectors: ['Consumer', 'SaaS', 'Marketplace', 'Fintech'],
    portfolio: ['Twitter', 'Uber', 'Snap', 'WeWork', 'Yelp'],
    ticketSize: '$1M – $25M',
    website: 'https://www.benchmark.com',
  },
];

// ──────────────────────────────────────────────
// GOVERNMENT SCHEMES DATABASE
// ──────────────────────────────────────────────

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    name: 'Startup India Recognition (DPIIT)',
    agency: 'Department for Promotion of Industry and Internal Trade',
    description: 'Official recognition for startups enabling tax exemptions, self-certification under 9 labour laws, faster patent examination, and access to ₹10,000 Cr Fund of Funds.',
    amount: 'Tax benefits + access to ₹10,000 Cr FoF',
    eligibility: ['Age < 10 years', 'Annual turnover < ₹100 Cr', 'Working towards innovation/scalable business model'],
    sectors: ['All sectors'],
    stage: ['Idea', 'Pre-Seed', 'Seed', 'Series A'],
    deadline: 'Rolling (Apply anytime)',
    link: 'https://www.nsws.gov.in/',
    type: 'Recognition',
    state: 'National',
  },
  {
    name: 'NIDHI-PRAYAS (Proof of Concept Grant)',
    agency: 'DST – National Initiative for Developing and Harnessing Innovations',
    description: 'Up to ₹10 lakh to individual innovators and startups for developing and testing Proof of Concept (PoC). Perfect for early-stage deep tech and hardware startups.',
    amount: '₹10 Lakh (non-dilutive grant)',
    eligibility: ['Indian citizen/startup', 'Idea/PoC stage', 'Technology/innovation focus'],
    sectors: ['Deep Tech', 'Hardware', 'AI/ML', 'Biotech', 'Agritech', 'CleanTech'],
    stage: ['Idea', 'Pre-Seed'],
    deadline: 'Rolling (Through NIDHI-PRAYAS centers)',
    link: 'https://www.nidhi-prayas.org',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'NIDHI-EIR (Entrepreneur in Residence)',
    agency: 'DST – National Initiative for Developing and Harnessing Innovations',
    description: 'Monthly stipend of ₹30,000 for up to 1 year for promising entrepreneurs to pursue their startup idea full-time without financial worry.',
    amount: '₹30,000/month for 1 year (₹3.6 Lakh total)',
    eligibility: ['Graduate from recognized institute', 'Full-time startup focus', 'Promising idea stage'],
    sectors: ['Technology', 'Deep Tech', 'Innovation-driven'],
    stage: ['Idea', 'Pre-Seed'],
    deadline: 'Rolling (Through NIDHI-EIR centers)',
    link: 'https://www.nidhi-eir.in',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'BIRAC SITARE-G (Biotech Ignition Grant)',
    agency: 'Biotechnology Industry Research Assistance Council',
    description: 'Up to ₹50 lakh grant for biotech/healthtech startups at Seed to Series A stage. For product development, clinical validation, scale-up.',
    amount: 'Up to ₹50 Lakh (non-dilutive)',
    eligibility: ['Biotech/Healthtech focus', 'DPIIT recognized preferred', 'Prototype or validation stage'],
    sectors: ['Biotech', 'Healthtech', 'Pharma', 'Medtech', 'Agri-biotech'],
    stage: ['Pre-Seed', 'Seed'],
    deadline: 'Quarterly calls — check BIRAC portal',
    link: 'https://birac.nic.in/login.php',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'TDB Technology Development Program',
    agency: 'Technology Development Board, DST',
    description: 'Soft loan at 5% interest for commercializing indigenous technology. Up to ₹10 Cr for Indian companies developing/commercializing tech products.',
    amount: 'Up to ₹10 Crore (5% p.a. soft loan)',
    eligibility: ['Indian company', 'Technology commercialization', 'At least 50% Indian equity'],
    sectors: ['Technology', 'Manufacturing', 'Deep Tech', 'CleanTech'],
    stage: ['Seed', 'Series A'],
    deadline: 'Rolling applications',
    link: 'https://www.tdb.gov.in',
    type: 'Loan',
    state: 'National',
  },
  {
    name: 'Atal Innovation Mission (AIM) Grant',
    agency: 'NITI Aayog',
    description: 'Incubation support, infrastructure, and mentorship for early-stage startups through 60+ Atal Incubation Centres across India.',
    amount: 'Up to ₹10 Crore (infrastructure + support)',
    eligibility: ['Early-stage startup', 'Innovation-driven idea', 'Social/economic impact'],
    sectors: ['All sectors — Agri, Health, Water, Energy, Mobility, Education'],
    stage: ['Idea', 'Pre-Seed', 'Seed'],
    deadline: 'Rolling (apply to nearest AIC)',
    link: 'https://aim.gov.in',
    type: 'Incubation',
    state: 'National',
  },
  {
    name: 'Startup India Seed Fund Scheme (SISFS)',
    agency: 'DPIIT / Startup India',
    description: 'Non-dilutive seed funding up to ₹50 lakh disbursed via DPIIT-recognized incubators. Covers PoC, prototype, product trials, and market entry.',
    amount: 'Up to ₹50 Lakh (non-dilutive)',
    eligibility: ['DPIIT recognized', 'Incorporated < 2 years', 'Prototype/PoC stage'],
    sectors: ['All sectors'],
    stage: ['Idea', 'Pre-Seed'],
    deadline: 'Rolling (via incubators)',
    link: 'https://seedfund.startupindia.gov.in',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'MeitY Startup Hub (MSH)',
    agency: 'Ministry of Electronics and Information Technology',
    description: 'Grants, mentorship, and market access for IT/software/AI startups. Special focus on deep tech, cybersecurity, and digital India initiatives.',
    amount: 'Up to ₹25 Lakh + market access',
    eligibility: ['IT/software/AI/ML startup', 'DPIIT recognized preferred', 'Prototype ready'],
    sectors: ['AI/ML', 'SaaS', 'Cybersecurity', 'IoT', 'Blockchain', 'AR/VR'],
    stage: ['Pre-Seed', 'Seed', 'Series A'],
    deadline: 'Quarterly calls — check MSH portal',
    link: 'https://mshindia.in',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'MSME Technology Upgradation Scheme (CLCSS)',
    agency: 'Ministry of MSME',
    description: '15% capital subsidy (max ₹15 lakh) for technology upgradation for small businesses on institutional credit. For manufacturing/product startups.',
    amount: '15% subsidy up to ₹15 Lakh',
    eligibility: ['MSME registered', 'Manufacturing or product', 'Technology upgrade investment'],
    sectors: ['Manufacturing', 'Hardware', 'Textiles', 'Food Processing', 'Leather'],
    stage: ['Seed', 'Series A'],
    deadline: 'Rolling',
    link: 'https://my.msme.gov.in/MyMsme/Reg/Welcome.aspx',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'iCreate Startup Grant (Gujarat)',
    agency: 'International Centre for Entrepreneurship and Technology, Gujarat',
    description: 'Grant + incubation for tech startups in Gujarat. Up to ₹10 lakh seed grant, office space, mentorship, and investor connects.',
    amount: 'Up to ₹10 Lakh + incubation support',
    eligibility: ['Gujarat-based or willing to relocate', 'Tech startup', 'Early stage'],
    sectors: ['Technology', 'AI/ML', 'Cleantech', 'Healthtech', 'Agritech'],
    stage: ['Pre-Seed', 'Seed'],
    deadline: 'Rolling (quarterly intakes)',
    link: 'https://www.icreate.org.in',
    type: 'Grant',
    state: 'State',
  },
  {
    name: 'Tamil Nadu Startup & Innovation Policy 2023',
    agency: 'StartupTN (Govt of Tamil Nadu)',
    description: 'Cash incentives of up to ₹30 lakh for Tamil Nadu-based startups. Special support for women-led startups and deep tech.',
    amount: 'Up to ₹30 Lakh cash incentive',
    eligibility: ['Tamil Nadu-registered company', 'DPIIT recognized', '< 5 years old'],
    sectors: ['All sectors — special focus on CleanTech, AI, Healthtech'],
    stage: ['Pre-Seed', 'Seed', 'Series A'],
    deadline: 'Rolling',
    link: 'https://startuptn.in/tanseed/',
    type: 'Grant',
    state: 'State',
  },
  {
    name: 'Kerala Startup Mission (KSUM)',
    agency: 'Govt of Kerala',
    description: 'Seed funding up to ₹10 lakh, incubation, co-working space and mentorship for Kerala-based tech startups.',
    amount: 'Up to ₹10 Lakh + free incubation',
    eligibility: ['Kerala-based startup', 'Technology focus', 'Early stage'],
    sectors: ['IT', 'AI/ML', 'IoT', 'Healthcare Tech', 'Agritech'],
    stage: ['Idea', 'Pre-Seed', 'Seed'],
    deadline: 'Rolling',
    link: 'https://schemes.startupmission.in/',
    type: 'Grant',
    state: 'State',
  },
  {
    name: 'Telangana State Innovation Cell (TSIC)',
    agency: 'Govt of Telangana / T-Works',
    description: 'Hardware startup support with prototyping facilities, funding connections, and access to T-Works (India\'s largest prototyping facility).',
    amount: 'Access to ₹100Cr+ facility + grants',
    eligibility: ['Telangana-based preferred', 'Hardware/IoT focus', 'Prototype stage'],
    sectors: ['Hardware', 'IoT', 'Electronics', 'Robotics', 'Deep Tech'],
    stage: ['Pre-Seed', 'Seed'],
    deadline: 'Rolling',
    link: 'https://t-works.io',
    type: 'Incubation',
    state: 'State',
  },
  {
    name: 'Make in India Initiative (PLI Scheme)',
    agency: 'Ministry of Commerce and Industry',
    description: 'Production Linked Incentive for manufacturing startups — 4-6% incentive on incremental sales from India-manufactured products.',
    amount: '4–6% on incremental sales',
    eligibility: ['Manufacturing startup', 'India-based production', 'Specific eligible sectors only'],
    sectors: ['Electronics', 'Pharma', 'Textiles', 'Medical Devices', 'Auto Components'],
    stage: ['Seed', 'Series A', 'Series B'],
    deadline: 'Sector-specific — check PLI portal',
    link: 'https://www.makeinindia.com/pli',
    type: 'Grant',
    state: 'National',
  },
  {
    name: 'NASSCOM 10,000 Startups Program',
    agency: 'NASSCOM',
    description: 'India\'s largest tech startup program. Market access, investor connects, AWS/GCP cloud credits, and mentorship from top industry leaders.',
    amount: 'Cloud credits + investor access (non-cash)',
    eligibility: ['Tech startup', '< 7 years old', 'Annual turnover < ₹25 Cr'],
    sectors: ['SaaS', 'AI/ML', 'IoT', 'Fintech', 'Healthtech', 'Enterprise Tech'],
    stage: ['Pre-Seed', 'Seed', 'Series A'],
    deadline: 'Rolling applications',
    link: 'https://10000startups.com',
    type: 'Incubation',
    state: 'National',
  },
];

// ──────────────────────────────────────────────
// MARKET BENCHMARKS BY SECTOR (India)
// ──────────────────────────────────────────────

export const MARKET_BENCHMARKS: MarketBenchmark[] = [
  { sector: 'SaaS (B2B)', avgCAC_INR: '₹8,000 – ₹25,000', avgLTV_INR: '₹80,000 – ₹3,00,000', avgChurn: '3–8% monthly', avgARPU_INR: '₹2,000 – ₹15,000/mo', growthRate: '25–50% YoY' },
  { sector: 'Fintech', avgCAC_INR: '₹500 – ₹2,000', avgLTV_INR: '₹5,000 – ₹30,000', avgChurn: '5–15% monthly', avgARPU_INR: '₹100 – ₹500/mo', growthRate: '30–80% YoY' },
  { sector: 'Edtech', avgCAC_INR: '₹1,500 – ₹5,000', avgLTV_INR: '₹8,000 – ₹25,000', avgChurn: '10–25% monthly', avgARPU_INR: '₹500 – ₹2,000/mo', growthRate: '20–40% YoY' },
  { sector: 'Healthtech', avgCAC_INR: '₹500 – ₹3,000', avgLTV_INR: '₹3,000 – ₹20,000', avgChurn: '8–20% monthly', avgARPU_INR: '₹200 – ₹1,500/mo', growthRate: '20–35% YoY' },
  { sector: 'E-commerce / D2C', avgCAC_INR: '₹200 – ₹800', avgLTV_INR: '₹1,500 – ₹8,000', avgChurn: '40–70% annually', avgARPU_INR: '₹1,200 – ₹5,000/order', growthRate: '25–60% YoY' },
  { sector: 'Agritech', avgCAC_INR: '₹1,000 – ₹4,000', avgLTV_INR: '₹5,000 – ₹30,000', avgChurn: '15–30% annually', avgARPU_INR: '₹300 – ₹2,000/season', growthRate: '15–30% YoY' },
  { sector: 'Logistics / Delivery', avgCAC_INR: '₹300 – ₹1,500', avgLTV_INR: '₹2,000 – ₹15,000', avgChurn: '10–20% monthly', avgARPU_INR: '₹50 – ₹300/delivery', growthRate: '20–45% YoY' },
  { sector: 'AI/ML SaaS', avgCAC_INR: '₹10,000 – ₹50,000', avgLTV_INR: '₹1,00,000 – ₹10,00,000', avgChurn: '2–6% monthly', avgARPU_INR: '₹5,000 – ₹50,000/mo', growthRate: '40–100% YoY' },
  { sector: 'Consumer App', avgCAC_INR: '₹50 – ₹500', avgLTV_INR: '₹500 – ₹5,000', avgChurn: '30–60% monthly', avgARPU_INR: '₹20 – ₹200/mo', growthRate: '30–70% YoY' },
  { sector: 'HR/Workforce Tech', avgCAC_INR: '₹15,000 – ₹60,000', avgLTV_INR: '₹1,50,000 – ₹8,00,000', avgChurn: '3–8% annually', avgARPU_INR: '₹10,000 – ₹80,000/mo', growthRate: '20–35% YoY' },
];

// ──────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────

export function matchSchemesToStartup(sector: string, stage: string, state?: string): GovernmentScheme[] {
  const sectorLower = sector.toLowerCase();
  const stageLower = stage.toLowerCase();

  return GOVERNMENT_SCHEMES.filter(scheme => {
    const sectorMatch =
      scheme.sectors.some(s => s.toLowerCase() === 'all sectors') ||
      scheme.sectors.some(s => s.toLowerCase().includes(sectorLower) || sectorLower.includes(s.toLowerCase()));

    const stageMatch = scheme.stage.some(s => s.toLowerCase().includes(stageLower) || stageLower.includes(s.toLowerCase()));

    return sectorMatch && stageMatch;
  }).slice(0, 8);
}

export function matchInvestorsToStartup(sector: string, stage: string, geography?: string): InvestorRecord[] {
  const sectorLower = sector.toLowerCase();
  const stageLower = stage.toLowerCase();

  return INVESTORS.filter(inv => {
    const sectorMatch = inv.sectors.some(s =>
      s.toLowerCase().includes(sectorLower) || sectorLower.includes(s.toLowerCase())
    );
    const stageMatch = inv.stages.some(s =>
      s.toLowerCase().includes(stageLower) || stageLower.includes(s.toLowerCase())
    );
    const geoMatch = !geography || inv.geography === geography || inv.geography === 'Global';
    return sectorMatch && stageMatch && geoMatch;
  }).slice(0, 10);
}

export function getBenchmarkForSector(sector: string): MarketBenchmark | undefined {
  const lower = sector.toLowerCase();
  return MARKET_BENCHMARKS.find(b =>
    b.sector.toLowerCase().includes(lower) || lower.includes(b.sector.toLowerCase().split(' ')[0])
  );
}
