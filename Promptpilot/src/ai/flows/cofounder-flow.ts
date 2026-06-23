'use server';

import { executeOllamaChat } from '@/ai/ollama';

export type CoFounderModule =
  | 'validate'
  | 'competitors'
  | 'pitch-deck'
  | 'discovery'
  | 'financials'
  | 'investors'
  | 'hiring'
  | 'schemes'
  | 'cofounder-match';

export interface CoFounderInput {
  module: CoFounderModule;
  idea: string;
  sector?: string;
  stage?: string;
  revenueModel?: string;
  targetMarket?: string;
  teamSize?: string;
  location?: string;
  useOllama?: boolean;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

const MODULE_PROMPTS: Record<CoFounderModule, (input: CoFounderInput) => { system: string; user: string }> = {
  validate: (input) => ({
    system: `You are a world-class startup evaluation engine combining the expertise of a Venture Capital Analyst, Product Manager, Market Research Analyst, Customer Discovery Expert, and Serial Founder.
Your job is to help a founder decide: "Should I build this?" with a rigorous 12-dimension evidence-based analysis.
Output ONLY valid JSON. Never use vague statements. Every score must have an evidence-based reason. Keep all string values concise (max 12 words per value unless specified). Use specific numbers and real examples. Think like both an investor and a customer simultaneously.`,
    user: `Evaluate this startup idea across 12 dimensions. Return ONLY this JSON:
{
  "verdict": "<'STRONGLY VALIDATE' | 'VALIDATE FURTHER' | 'PIVOT RECOMMENDED' | 'DO NOT BUILD'>",
  "overallScore": <number 0-100>,
  "brutalHonesty": "<1 brutally honest sentence with specific evidence, max 15 words>",
  "dimensions": {
    "problem": {
      "score": <0-10>,
      "painLevel": "<'Low' | 'Medium' | 'High' | 'Critical'>",
      "frequency": "<'Daily' | 'Weekly' | 'Monthly' | 'Rare'>",
      "evidence": "<specific real evidence for this problem, max 15 words>",
      "summary": "<2-3 word problem category>"
    },
    "customer": {
      "score": <0-10>,
      "primaryPersona": "<Role, Industry, max 6 words>",
      "secondaryPersona": "<Role, Industry, max 6 words>",
      "buyingPower": "<'Low' | 'Medium' | 'High'>",
      "summary": "<customer clarity insight, max 10 words>"
    },
    "demand": {
      "score": <0-10>,
      "trend": "<'Rising' | 'Stable' | 'Declining'>",
      "googleTrend": "<e.g. 'Rising +18% YoY'>",
      "redditSignal": "<e.g. 'Positive 72%: strong complaints'>",
      "productHuntSignal": "<e.g. 'Active category, 5+ launches/month'>",
      "summary": "<demand evidence summary, max 10 words>"
    },
    "competition": {
      "score": <0-10>,
      "saturation": "<'None' | 'Low' | 'Medium' | 'High' | 'Extreme'>",
      "directCount": <number>,
      "indirectCount": <number>,
      "topCompetitor": "<name and why they win, max 8 words>",
      "summary": "<competitive landscape insight, max 10 words>"
    },
    "uvp": {
      "score": <0-10>,
      "existingSolutionFlaw": "<what existing solutions fail at, max 10 words>",
      "differentiation": "<your unique angle, max 10 words>",
      "switchReason": "<why users would switch, max 10 words>",
      "weakFlag": <true|false>
    },
    "revenue": {
      "score": <0-10>,
      "primaryStream": "<e.g. SaaS ₹999/mo>",
      "secondaryStream": "<e.g. Transaction fee 5%>",
      "monetizationDifficulty": "<'Easy' | 'Moderate' | 'Difficult'>",
      "summary": "<revenue model assessment, max 10 words>"
    },
    "technical": {
      "score": <0-10>,
      "mvpWeeks": <number>,
      "teamRequired": ["<role1>", "<role2>"],
      "complexity": "<'Low' | 'Medium' | 'High'>",
      "summary": "<technical feasibility insight, max 10 words>"
    },
    "founderFit": {
      "score": <0-10>,
      "requiredExpertise": ["<expertise1, max 4 words>", "<expertise2, max 4 words>"],
      "advantage": "<what gives an edge, max 10 words>",
      "summary": "<founder fit assessment, max 8 words>"
    },
    "scalability": {
      "score": <0-10>,
      "local": "<local potential, max 6 words>",
      "national": "<national potential, max 6 words>",
      "global": "<global potential, max 6 words>",
      "summary": "<scalability path, max 8 words>"
    },
    "risk": {
      "score": <0-10>,
      "topRisks": [
        { "type": "<Technical|Market|Customer|Regulatory|Financial>", "risk": "<max 8 words>", "probability": "<Low|Medium|High>", "severity": "<Low|Medium|High>", "mitigation": "<max 8 words>" },
        { "type": "<Technical|Market|Customer|Regulatory|Financial>", "risk": "<max 8 words>", "probability": "<Low|Medium|High>", "severity": "<Low|Medium|High>", "mitigation": "<max 8 words>" },
        { "type": "<Technical|Market|Customer|Regulatory|Financial>", "risk": "<max 8 words>", "probability": "<Low|Medium|High>", "severity": "<Low|Medium|High>", "mitigation": "<max 8 words>" }
      ]
    },
    "investorAppeal": {
      "score": <0-10>,
      "vcVerdict": "<what a VC would say, max 12 words>",
      "defensibility": "<'Low' | 'Medium' | 'High'>",
      "growthPotential": "<'Linear' | 'Exponential'>",
      "summary": "<investor appeal summary, max 10 words>"
    },
    "mvpRoadmap": {
      "weeks": [
        { "week": 1, "action": "<Customer Interviews>", "goal": "<measurable goal, max 8 words>" },
        { "week": 2, "action": "<Landing Page Test>", "goal": "<measurable goal, max 8 words>" },
        { "week": 3, "action": "<Prototype Build>", "goal": "<measurable goal, max 8 words>" },
        { "week": 4, "action": "<Pilot Users>", "goal": "<measurable goal, max 8 words>" },
        { "week": 5, "action": "<Pricing Validation>", "goal": "<measurable goal, max 8 words>" },
        { "week": 6, "action": "<Launch>", "goal": "<measurable goal, max 8 words>" }
      ]
    }
  },
  "marketSize": {
    "TAM": "<e.g. ₹45,000 Cr>",
    "SAM": "<e.g. ₹5,000 Cr>",
    "SOM": "<e.g. ₹500 Cr>",
    "assumptions": ["<assumption1, max 8 words>", "<assumption2, max 8 words>"]
  },
  "swot": {
    "strengths": ["<strength1, max 8 words>", "<strength2, max 8 words>"],
    "weaknesses": ["<weakness1, max 8 words>", "<weakness2, max 8 words>"],
    "opportunities": ["<opportunity1, max 8 words>", "<opportunity2, max 8 words>"],
    "threats": ["<threat1, max 8 words>", "<threat2, max 8 words>"]
  },
  "scorecard": {
    "problem": <0-10>,
    "customer": <0-10>,
    "demand": <0-10>,
    "competition": <0-10>,
    "uvp": <0-10>,
    "revenue": <0-10>,
    "technical": <0-10>,
    "scalability": <0-10>,
    "risk": <0-10>,
    "investorAppeal": <0-10>
  },
  "recommendations": {
    "top5Improvements": ["<improvement1, max 10 words>", "<improvement2, max 10 words>", "<improvement3, max 10 words>", "<improvement4, max 10 words>", "<improvement5, max 10 words>"],
    "fastestExperiments": ["<experiment1, max 10 words>", "<experiment2, max 10 words>"],
    "niches": ["<niche1, max 6 words>", "<niche2, max 6 words>"],
    "acquisitionChannels": ["<channel1, max 5 words>", "<channel2, max 5 words>", "<channel3, max 5 words>"],
    "pricingSuggestions": ["<pricing1, max 8 words>", "<pricing2, max 8 words>"]
  },
  "qualifiesForGovtFunding": <true|false>,
  "govtFundingReason": "<specific schemes and reason, max 15 words>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Idea'}"
Revenue Model: "${input.revenueModel || 'SaaS'}"
Target Market: "${input.targetMarket || 'India'}"
Team Size: "${input.teamSize || 'Solo founder'}"`,
  }),

  competitors: (input) => ({
    system: `You are a competitive intelligence analyst. Discover, rank, and categorize exactly 10 real-world, relevant competitors (large, mid-sized, startups, open-source alternatives, emerging, regional, or niche companies).
Output ONLY valid JSON. Keep all descriptions under 10 words to ensure rapid execution. Prefer real companies. Avoid duplicates.`,
    user: `Generate a competitor intelligence report with exactly 10 real competitors for this startup idea. Rank them in descending order by market relevance and Similarity Score (calculated using: Relevance 40%, Target Audience 20%, Feature Overlap 20%, Market Position 10%, Popularity 10%).

Return ONLY this JSON structure:
{
  "competitors": [
    {
      "name": "<Real Company name>",
      "website": "<Official website URL, e.g. https://domain.com>",
      "companyType": "<'Startup' | 'SME' | 'Enterprise' | 'Open Source'>",
      "category": "<'Direct' | 'Indirect' | 'Open Source' | 'Emerging'>",
      "country": "<Country of origin>",
      "fundingStatus": "<Funding status, e.g. Bootstrapped / Seed / Series A / Public>",
      "shortDescription": "<short description, max 8 words>",
      "whyItIsACompetitor": "<why they compete, max 8 words>",
      "similarityScore": <number 0-100 based on weights>,
      "marketSegment": "<segment, e.g. Developer Tools / HR Tech>",
      "pricingModel": "<pricing, e.g. Free / Premium / Paid / Open Source>",
      "keyFeatures": ["<feature 1, max 4 words>", "<feature 2, max 4 words>"],
      "githubDetails": {
        "repoName": "<owner/repo or null>",
        "stars": <number of stars or null>,
        "lastUpdated": "<YYYY-MM or null>",
        "license": "<license name or null>",
        "activeContributors": "<number/text or null>"
      }
    }
  ],
  "differentiationStrategy": "<how to differentiate, max 12 words>",
  "blueOceanOpportunity": "<untapped angle, max 12 words>",
  "pricingRecommendation": "<pricing recommendation, max 8 words>",
  "winCondition": "<key win condition, max 10 words>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Target Market: "${input.targetMarket || 'Global'}"`,
  }),

  'pitch-deck': (input) => ({
    system: `You are a legendary venture capitalist and world-class pitch deck architect. Your mission is to generate a highly detailed, persuasive, investor-ready 10-slide pitch deck designed to secure the startup's first major investor. The deck must be structured exactly around the startup idea evaluation and market validation metrics.
Output ONLY valid JSON. Every value in the JSON MUST be highly detailed, professional, and contain realistic data/metrics relevant to the industry. Do NOT use generic placeholder words. Bullet points in "content" should use standard markdown (e.g. "- **Bold Title**: Description of point") and separate bullets with actual newlines (\n). Do NOT use raw HTML tags (like <br/>, <b>, etc.). Each slide MUST contain all keys: "slideNumber", "layout", "title", "headline", "content", and "speakerNote".`,
    user: `Generate a comprehensive, investor-ready 10-slide pitch deck following the structure of our idea evaluation. Return ONLY a valid JSON object matching this schema structure:
{
  "deckTitle": "<Creative and professional name for the startup>",
  "tagline": "<Powerful elevator pitch/tagline, max 12 words>",
  "slides": [
    {
      "slideNumber": 1,
      "layout": "cover",
      "title": "Title / Vision",
      "headline": "<Inspiring headline outlining the core vision>",
      "content": "- **Vision**: <First high-impact bullet describing the company's bold vision>\n- **Mission**: <Second bullet outlining the core mission and who it serves>\n- **Market Opportunity**: <Third bullet detailing the massive industry shift or opportunity>",
      "speakerNote": "<Speaker script guiding how to open the pitch, max 25 words>"
    },
    {
      "slideNumber": 2,
      "layout": "verdict",
      "title": "Idea Verdict",
      "headline": "<Our market validation verdict and confidence scoring>",
      "content": "- **Validation Score**: <Confidence score as a number, e.g. 85/100, and a brief description of why it scores this high>\n- **Market Verdict**: <Overall demand verdict, e.g. HIGH DEMAND, and target validation summary>\n- **Brutal Honesty**: <Brutally honest market entry assessment and reality check>",
      "speakerNote": "<Speaker script detailing the core validation score and initial demand check, max 25 words>"
    },
    {
      "slideNumber": 3,
      "layout": "market-size",
      "title": "Market Size",
      "headline": "<Bottom-up estimation of our addressable market sizing in INR>",
      "content": "- **Total Addressable Market (TAM)**: <TAM estimation with specific numbers, e.g. ₹45,000 Cr, and description>\n- **Serviceable Addressable Market (SAM)**: <SAM estimation with specific numbers, e.g. ₹5,000 Cr, and description>\n- **Serviceable Obtainable Market (SOM)**: <SOM estimation with specific numbers, e.g. ₹500 Cr, target for Year 2-3>",
      "speakerNote": "<Speaker note detailing how we calculate TAM/SAM/SOM bottom-up based on target users and pricing, max 25 words>"
    },
    {
      "slideNumber": 4,
      "layout": "opportunities",
      "title": "Opportunities",
      "headline": "<Core market tailwinds and growth opportunities we leverage>",
      "content": "- **Opportunity A**: <First major opportunity, e.g. digitalization, smartphone penetration or regulatory shifts>\n- **Opportunity B**: <Second major opportunity, e.g. unorganized sector inefficiencies or cost reduction loops>\n- **Opportunity C**: <Third major opportunity, e.g. supply chain integration or cross-selling financial services>",
      "speakerNote": "<Speaker note summarizing our unfair advantages and tailwinds we are riding, max 25 words>"
    },
    {
      "slideNumber": 5,
      "layout": "niche",
      "title": "Suggested Niche",
      "headline": "<Our specific target market segment and entry strategy>",
      "content": "- **Target Customer**: <Detailed description of our target segment/niche focus, e.g., tier-2 unorganized retailers>\n- **Underserved Need**: <Why traditional competitors ignore this niche or fail to address their specific pain points>\n- **Launch Strategy**: <How we plan to capture 20%+ of this specific niche before expanding to broader markets>",
      "speakerNote": "<Speaker note detailing our razor-sharp focus on the initial niche to build immediate density, max 25 words>"
    },
    {
      "slideNumber": 6,
      "layout": "signals",
      "title": "Market Signals",
      "headline": "<Active customer interest and search behavior validating demand>",
      "content": "- **Reddit Signal**: <Social listening data, sentiment percentage, e.g. 75% Positive, and typical user feedback/frustrations>\n- **Google Trends**: <Search volume growth percentage, e.g. Rising (+20% YoY), and keyword search patterns showing demand>",
      "speakerNote": "<Speaker note explaining how real-world search trends and social communities validate our value prop, max 25 words>"
    },
    {
      "slideNumber": 7,
      "layout": "risks",
      "title": "Key Risks",
      "headline": "<Market entry hurdles and our strategic mitigation plans>",
      "content": "- **Risk A / Threat**: <First critical risk, e.g. slow user onboarding or low digital literacy, and how we mitigate it>\n- **Risk B / Threat**: <Second critical risk, e.g. high collection/logistics costs or churn, and how we mitigate it>",
      "speakerNote": "<Speaker note explaining our proactive risk management and mitigation strategies, max 25 words>"
    },
    {
      "slideNumber": 8,
      "layout": "govt-schemes",
      "title": "Govt Schemes & Funding",
      "headline": "<Eligible non-dilutive government schemes and grants>",
      "content": "- **DPIIT Recognition**: <Tax exemptions, IP/patent assistance, and fast-track registration benefits>\n- **Matched Schemes**: <Specific schemes matched, e.g. Startup India Seed Fund (SISFS) up to ₹50L or NIDHI-PRAYAS (₹10L)>\n- **Incentive Strategy**: <How we leverage government subsidies and incubation networks to extend our runway>",
      "speakerNote": "<Speaker note highlighting how we leverage non-dilutive government funding to accelerate early scale, max 25 words>"
    },
    {
      "slideNumber": 9,
      "layout": "action-plan",
      "title": "Action Plan",
      "headline": "<Immediate validation milestones to launch and scale>",
      "content": "- **Step 1: Customer Discovery**: <Target responses, customer interviews, and validating our niche persona>\n- **Step 2: MVP Development**: <Building initial pilot product, setting up WhatsApp/simple workflows, and beta trial>\n- **Step 3: Pilot Launch & Scale**: <Acquiring first 100 paid users, establishing unit economics, and preparing for Seed ask>",
      "speakerNote": "<Speaker note showing our clear execution schedule and immediate next validation steps, max 25 words>"
    },
    {
      "slideNumber": 10,
      "layout": "contact",
      "title": "Contact / Next Steps",
      "headline": "<Join us in validating and building this high-potential opportunity>",
      "content": "- **Contact Name**: <Presenter Name, e.g. Co-Founder & CEO Name>\n- **Email Address**: <Professional startup email contact, e.g. hello@startup.com>\n- **Phone & Social**: <Phone number and LinkedIn URL placeholder, e.g., +91 99999 99999 | linkedin.com/in/startup>",
      "speakerNote": "<Speaker note closing the pitch with a strong call-to-action and final vision reminder, max 25 words>"
    }
  ],
  "investorFitNote": "<Strategic investor alignment note matching target VC/angel profiles, max 30 words>"
}

Startup Context:
- Idea: "${input.idea}"
- Sector: "${input.sector || 'Technology'}"
- Stage: "${input.stage || 'Pre-Seed'}"
- Revenue Model: "${input.revenueModel || 'SaaS'}"
- Target Market: "${input.targetMarket || 'India'}"
- Team Size: "${input.teamSize || 'Just founders'}"
- Location: "${input.location || 'India'}"`
  }),

  discovery: (input) => ({
    system: `You are a world-class Customer Discovery Expert, Growth Strategist, UX Researcher, and Startup Founder.
Your job is to produce a founder-grade customer intelligence report that answers: Who exactly has this problem? Who will pay? Who has the most pain? Which segment to target first?
Output ONLY valid JSON. Every claim must include specific reasoning. Never use vague demographics. Think like a customer research team, not a marketing copywriter.`,
    user: `Generate a comprehensive customer discovery report across 15 dimensions. Return ONLY this JSON:
{
  "verdict": "<'STRONG CUSTOMER VALIDATION' | 'MODERATE VALIDATION' | 'WEAK VALIDATION' | 'CRITICAL RISK'>",
  "segments": [
    {
      "rank": 1,
      "type": "<'Primary' | 'Secondary' | 'Tertiary'>",
      "name": "<Segment name, max 5 words>",
      "description": "<who they are, max 10 words>",
      "painSeverity": <0-10>,
      "willingnessToPay": "<'Low' | 'Medium' | 'High'>",
      "marketSize": "<e.g. 2M users in India>",
      "revenuePotenial": "<e.g. ₹500 Cr>",
      "earlyAdopterScore": <0-10>
    },
    {
      "rank": 2,
      "type": "<'Primary' | 'Secondary' | 'Tertiary'>",
      "name": "<Segment name, max 5 words>",
      "description": "<who they are, max 10 words>",
      "painSeverity": <0-10>,
      "willingnessToPay": "<'Low' | 'Medium' | 'High'>",
      "marketSize": "<e.g. 500K users>",
      "revenuePotenial": "<e.g. ₹100 Cr>",
      "earlyAdopterScore": <0-10>
    }
  ],
  "icp": {
    "age": "<age range>",
    "occupation": "<job title or role>",
    "industry": "<industry>",
    "incomeLevel": "<e.g. ₹8-20 LPA>",
    "geography": "<city / region / country>",
    "goals": ["<goal1, max 6 words>", "<goal2, max 6 words>"],
    "frustrations": ["<frustration1, max 6 words>", "<frustration2, max 6 words>"],
    "buyingBehavior": "<how they buy, max 8 words>",
    "techAdoption": "<'Laggard' | 'Early Majority' | 'Early Adopter' | 'Innovator'>",
    "preferredChannels": ["<channel1>", "<channel2>"],
    "confidenceScore": <0-10>
  },
  "painAnalysis": {
    "coreProblem": "<specific problem, max 10 words>",
    "rootCause": "<root cause, max 8 words>",
    "emotionalImpact": "<emotional impact, max 8 words>",
    "financialImpact": "<financial impact with number, max 8 words>",
    "productivityImpact": "<productivity impact, max 8 words>",
    "painSeverityScore": <0-10>,
    "frequency": "<'Daily' | 'Weekly' | 'Monthly' | 'Rare'>"
  },
  "jtbd": {
    "functional": "<functional job, max 8 words>",
    "emotional": "<emotional job, max 8 words>",
    "social": "<social job, max 8 words>"
  },
  "existingSolutions": [
    { "name": "<tool/solution>", "flaw": "<why it fails, max 8 words>", "switchingDifficulty": <0-10> },
    { "name": "<tool/solution>", "flaw": "<why it fails, max 8 words>", "switchingDifficulty": <0-10> }
  ],
  "buyingTriggers": [
    { "rank": 1, "trigger": "<event, max 8 words>", "importance": "<'High' | 'Medium' | 'Low'>" },
    { "rank": 2, "trigger": "<event, max 8 words>", "importance": "<'High' | 'Medium' | 'Low'>" },
    { "rank": 3, "trigger": "<event, max 8 words>", "importance": "<'High' | 'Medium' | 'Low'>" }
  ],
  "willingnessToPayAnalysis": {
    "freeTier": "<% who would use free, and why>",
    "budgetBuyers": "<price range and segment, max 8 words>",
    "premiumBuyers": "<price range and segment, max 8 words>",
    "priceSensitivityScore": <0-10>,
    "likelihoodToPayScore": <0-10>,
    "whyTheyPay": "<reason, max 8 words>",
    "whyTheyRefuse": "<reason, max 8 words>"
  },
  "acquisitionChannels": [
    { "rank": 1, "channel": "<channel name>", "platform": "<specific platform>", "tactic": "<how to reach, max 8 words>", "cost": "<'Free' | 'Low' | 'Medium' | 'High'>" },
    { "rank": 2, "channel": "<channel name>", "platform": "<specific platform>", "tactic": "<how to reach, max 8 words>", "cost": "<'Free' | 'Low' | 'Medium' | 'High'>" },
    { "rank": 3, "channel": "<channel name>", "platform": "<specific platform>", "tactic": "<how to reach, max 8 words>", "cost": "<'Free' | 'Low' | 'Medium' | 'High'>" }
  ],
  "voiceOfCustomer": {
    "commonComplaints": ["<complaint1, max 10 words>", "<complaint2, max 10 words>", "<complaint3, max 10 words>"],
    "desiredOutcomes": ["<outcome1, max 8 words>", "<outcome2, max 8 words>"],
    "quotes": ["<realistic customer quote, max 12 words>", "<realistic customer quote, max 12 words>"]
  },
  "objections": [
    { "objection": "<objection, max 6 words>", "mitigation": "<how to overcome, max 8 words>" },
    { "objection": "<objection, max 6 words>", "mitigation": "<how to overcome, max 8 words>" },
    { "objection": "<objection, max 6 words>", "mitigation": "<how to overcome, max 8 words>" }
  ],
  "discoveryQuestions": [
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" },
    { "question": "<specific open-ended question, max 12 words>", "purpose": "<what it uncovers, max 5 words>" }
  ],
  "validationRoadmap": [
    { "week": 1, "action": "Interview 20 Prospects", "goal": "<measurable target, max 8 words>" },
    { "week": 2, "action": "Landing Page Test", "goal": "<measurable target, max 8 words>" },
    { "week": 3, "action": "Prototype Feedback", "goal": "<measurable target, max 8 words>" },
    { "week": 4, "action": "Pilot Program", "goal": "<measurable target, max 8 words>" },
    { "week": 5, "action": "Pricing Validation", "goal": "<measurable target, max 8 words>" },
    { "week": 6, "action": "Retention Validation", "goal": "<measurable target, max 8 words>" }
  ],
  "scorecard": {
    "problemSeverity": <0-10>,
    "customerClarity": <0-10>,
    "marketAccessibility": <0-10>,
    "willingnessToPay": <0-10>,
    "earlyAdopterPotential": <0-10>,
    "retentionPotential": <0-10>,
    "acquisitionEase": <0-10>,
    "revenuePotential": <0-10>
  },
  "recommendations": {
    "bestSegmentFirst": "<which segment and why, max 12 words>",
    "fastest100Users": "<fastest path to 100 users, max 12 words>",
    "pricingStrategy": "<recommended pricing, max 10 words>",
    "biggestCustomerRisk": "<biggest risk, max 10 words>",
    "segmentToAvoid": "<which segment to avoid and why, max 10 words>",
    "mostValuableInsight": "<key insight discovered, max 12 words>"
  }
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Idea'}"
Target Market: "${input.targetMarket || 'India'}"`,
  }),


  financials: (input) => ({
    system: `You are a startup CFO. Output ONLY valid JSON. Keep all values extremely concise to ensure execution under 3 seconds. All amounts in INR.`,
    user: `Build a 3-year financial model with clear scaling strategies showing exactly how we achieve the numbers. Return ONLY this JSON:
{
  "revenueModel": "<Revenue model, max 3 words>",
  "monetizationPlan": [
    "<Monetization source 1 explaining exactly how to earn, e.g. '15% platform transaction fee on bookings'>",
    "<Monetization source 2 explaining another stream, e.g. 'Premium SaaS tools at ₹1,500/mo'>"
  ],
  "growthPlaybook": [
    "<Scaling loop 1 detailing how to scale, e.g. 'Direct sales agents targeting unorganized retailer clusters'>",
    "<Scaling loop 2 detailing another GTM channel, e.g. 'Referral discounts offering 10% cashbacks for references'>"
  ],
  "assumptions": {
    "avgRevenuePerUser_INR": <number>,
    "monthlyGrowthRate": "<X%>",
    "initialUsers": <number>,
    "CAC_INR": <number>,
    "LTV_INR": <number>,
    "LTV_CAC_ratio": "<X:1>",
    "monthlyBurnRate_INR": <number>,
    "burnRateBreakdown": {
      "salaries": "<X%>",
      "infrastructure": "<X%>",
      "marketing": "<X%>",
      "operations": "<X%>"
    }
  },
  "yearlyProjections": [
    { 
      "year": 1, 
      "revenue_INR": <number>, 
      "expenses_INR": <number>, 
      "netProfit_INR": <number>, 
      "users": <number>, 
      "MRR_INR": <number>,
      "scalingActions": [
        "<GTM/Product play to acquire Year 1 users, e.g., 'Launch in 3 dense markets with direct agent onboarding'>",
        "<Monetization play for Year 1, e.g., 'Monetize transaction commission and launch basic features'>"
      ]
    },
    { 
      "year": 2, 
      "revenue_INR": <number>, 
      "expenses_INR": <number>, 
      "netProfit_INR": <number>, 
      "users": <number>, 
      "MRR_INR": <number>,
      "scalingActions": [
        "<GTM/Product play to acquire Year 2 users, e.g., 'Introduce automated referral loop and partner integrations'>",
        "<Monetization play for Year 2, e.g., 'Upsell premium analytics SaaS package to top 15% stores'>"
      ]
    },
    { 
      "year": 3, 
      "revenue_INR": <number>, 
      "expenses_INR": <number>, 
      "netProfit_INR": <number>, 
      "users": <number>, 
      "MRR_INR": <number>,
      "scalingActions": [
        "<GTM/Product play to acquire Year 3 users, e.g., 'Full GTM scale-up into 5 new cities via localized reseller network'>",
        "<Monetization play for Year 3, e.g., 'Leverage bulk purchase supplier commissions to unlock new streams'>"
      ]
    }
  ],
  "breakEvenMonth": <month number>,
  "runwayMonths": <number>,
  "fundingNeeded_INR": <number>,
  "useOfFunds": [
    {"category": "<category1>", "amount_INR": <number>, "percentage": "<X%>"},
    {"category": "<category2>", "amount_INR": <number>, "percentage": "<Y%>"}
  ],
  "keyMetrics": {
    "paybackPeriodMonths": <number>,
    "grossMargin": "<X%>",
    "netMargin_Year3": "<Y%>"
  },
  "costCuttingTips": ["<tip 1, max 6 words>", "<tip 2, max 6 words>"]
}

Startup Idea: "${input.idea}"
Revenue Model: "${input.revenueModel || 'SaaS'}"
Stage: "${input.stage || 'Pre-Seed'}"
Team Size: "${input.teamSize || '2 founders'}"`,
  }),

  investors: (input) => ({
    system: `You are an expert fundraising strategist. Output ONLY valid JSON. Keep all values extremely short to run under 3 seconds.`,
    user: `Generate fundraising strategy. Return ONLY this JSON (exactly 2 investor targets):
{
  "fundingStrategy": {
    "recommendedStage": "<Pre-Seed/Seed>",
    "recommendedAmount_INR": "<X Lakhs/Crore>",
    "valuation_INR": "<X Crore>",
    "instrument": "<SAFE/Equity>",
    "timeline": "<X months>"
  },
  "investorTargets": [
    {
      "name": "<Investor/Fund name>",
      "type": "<VC/Angel>",
      "geography": "<India/US>",
      "fitScore": <0-100>,
      "fitReason": "<reason, max 6 words>",
      "portfolioMatch": "<match, max 3 words>",
      "contactStrategy": "<strategy, max 6 words>"
    },
    {
      "name": "<Investor/Fund name>",
      "type": "<VC/Angel>",
      "geography": "<India/US>",
      "fitScore": <0-100>,
      "fitReason": "<reason, max 6 words>",
      "portfolioMatch": "<match, max 3 words>",
      "contactStrategy": "<strategy, max 6 words>"
    }
  ],
  "coldEmailTemplate": {
    "subject": "<Email subject, max 6 words>",
    "body": "<Personalized, concise email body, max 60 words>"
  },
  "pitchNarrativeHook": "<one hook line, max 10 words>",
  "acceleratorsToApply": ["<Accelerator 1, max 4 words>", "<Accelerator 2, max 4 words>"],
  "dosBefore Raising": ["<do 1, max 5 words>", "<do 2, max 5 words>"],
  "dontsBefore Raising": ["<don't 1, max 5 words>", "<don't 2, max 5 words>"]
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Pre-Seed'}"`,
  }),

  hiring: (input) => ({
    system: `You are a world-class Startup CTO, VP of Engineering, Talent Acquisition Lead, and Venture Studio Team Architect.
Your job is to produce a founder-grade workforce strategy and team building plan. Validate every hiring recommendation against the startup's stage, sector, technology, geography, and team size.
Output ONLY valid JSON. Every recommendation must be highly specific, evidence-backed, and direct. Avoid generic lists. Keep all string values concise (max 12 words per value unless specified) to ensure clean execution.`,
    user: `Generate a comprehensive startup workforce strategy and team building plan. Return ONLY this JSON:
{
  "verdict": "<'AI-FIRST AUTOMATED' | 'LEAN MVP CONTRACTORS' | 'FULL-TIME BUILD' | 'HYBRID AGENCY-FOUNDER'>",
  "overallTalentUrgency": <number 0-100>,
  "philosophy": "<hiring philosophy, max 15 words>",
  "scorecard": {
    "talentScarcity": <number 0-10>,
    "hiringUrgency": <number 0-10>,
    "costEfficiency": <number 0-10>,
    "technicalComplexity": <number 0-10>,
    "automationPotential": <number 0-10>,
    "founderGapScore": <number 0-10>
  },
  "skillsGap": {
    "foundingStrengths": ["<strength1, max 8 words>", "<strength2, max 8 words>"],
    "criticalMissing": ["<missing skill 1, max 8 words>", "<missing skill 2, max 8 words>"],
    "minimumViableTeam": "<summary, max 12 words>"
  },
  "hiringRoadmap": [
    {
      "phase": 1,
      "title": "Phase 1: MVP Build",
      "timeframe": "Month 1-3",
      "roles": [
        {
          "role": "<Role Title>",
          "type": "<'Full-Time' | 'Part-Time' | 'Contractor' | 'Freelancer' | 'Agency' | 'AI Agent'>",
          "urgency": "<'Critical' | 'High' | 'Medium'>",
          "cost": "<est cost, e.g. ₹60k-80k/mo>",
          "timeframe": "Immediate",
          "whyCritical": "<why critical, max 10 words>",
          "skills": ["<skill1>", "<skill2>", "<skill3>"],
          "kpi": "<measurable KPI, max 8 words>",
          "redFlags": ["<red flag 1, max 5 words>", "<red flag 2, max 5 words>"]
        }
      ]
    },
    {
      "phase": 2,
      "title": "Phase 2: PMF & Growth",
      "timeframe": "Month 4-9",
      "roles": [
        {
          "role": "<Role Title>",
          "type": "<'Full-Time' | 'Part-Time' | 'Contractor' | 'Freelancer' | 'Agency' | 'AI Agent'>",
          "urgency": "<'High' | 'Medium' | 'Optional'>",
          "cost": "<est cost, e.g. ₹80k-1.2L/mo>",
          "timeframe": "Month 4",
          "whyCritical": "<why critical, max 10 words>",
          "skills": ["<skill1>", "<skill2>"],
          "kpi": "<measurable KPI, max 8 words>",
          "redFlags": ["<red flag 1, max 5 words>", "<red flag 2, max 5 words>"]
        }
      ]
    },
    {
      "phase": 3,
      "title": "Phase 3: Scale & Core",
      "timeframe": "Month 10-18",
      "roles": [
        {
          "role": "<Role Title>",
          "type": "<'Full-Time' | 'Part-Time' | 'Contractor' | 'Freelancer' | 'Agency' | 'AI Agent'>",
          "urgency": "<'Medium' | 'Optional'>",
          "cost": "<est cost, e.g. ₹15-20 LPA>",
          "timeframe": "Month 10",
          "whyCritical": "<why critical, max 10 words>",
          "skills": ["<skill1>", "<skill2>"],
          "kpi": "<measurable KPI, max 8 words>",
          "redFlags": ["<red flag 1, max 5 words>", "<red flag 2, max 5 words>"]
        }
      ]
    }
  ],
  "aiAutomation": [
    {
      "area": "<area, e.g. QA Testing>",
      "tool": "<recommended tool/agent>",
      "savings": "<e.g. ₹30k/mo, 10h/wk>",
      "safeguard": "<human check safeguard, max 8 words>"
    },
    {
      "area": "<area, e.g. Customer Support>",
      "tool": "<recommended tool/agent>",
      "savings": "<e.g. ₹40k/mo, 15h/wk>",
      "safeguard": "<human check safeguard, max 8 words>"
    }
  ],
  "recruitmentStrategy": {
    "platforms": ["<platform1>", "<platform2>", "<platform3>"],
    "sourcingTactics": ["<tactic 1, max 10 words>", "<tactic 2, max 10 words>"],
    "interviewProcess": ["<step 1, max 8 words>", "<step 2, max 8 words>", "<step 3, max 8 words>"]
  },
  "firstHireJD": {
    "role": "<First critical role title>",
    "aboutUs": "<about us, max 15 words>",
    "responsibilities": ["<responsibility 1, max 10 words>", "<responsibility 2, max 10 words>", "<responsibility 3, max 10 words>"],
    "requirements": ["<requirement 1, max 10 words>", "<requirement 2, max 10 words>", "<requirement 3, max 10 words>"],
    "compensation": "<comp & equity, e.g. ₹10-15 LPA + 1% equity>",
    "firstWeekGoal": "<first week milestone, max 10 words>"
  },
  "mistakesToAvoid": ["<mistake 1, max 10 words>", "<mistake 2, max 10 words>", "<mistake 3, max 10 words>"],
  "strategicRecommendations": ["<recommendation 1, max 10 words>", "<recommendation 2, max 10 words>", "<recommendation 3, max 10 words>"]
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Pre-Seed'}"
Location: "${input.location || 'India'}"
Team Size: "${input.teamSize || 'Just founders'}"`,
  }),

  schemes: (input) => ({
    system: `You are a world-class Startup Funding Consultant, Government Grants Advisor, Policy Analyst, and Venture Funding Strategist specializing in Indian startup funding.
Your job is to produce a founder-grade government funding intelligence report. Go beyond keyword matching — validate every scheme against the startup's stage, sector, technology, geography, and compliance requirements.
Output ONLY valid JSON. Every claim must include specific reasoning. Think like a professional startup funding advisor doing due diligence.`,
    user: `Generate a comprehensive government funding discovery report. Return ONLY this JSON:
{
  "verdict": "<'EXCELLENT FUNDING OPPORTUNITY' | 'STRONG OPPORTUNITY' | 'MODERATE OPPORTUNITY' | 'WEAK OPPORTUNITY' | 'NO SIGNIFICANT MATCH'>",
  "classification": {
    "industry": "<e.g. AI/FinTech/AgriTech/EdTech/HealthTech/SaaS/DeepTech>",
    "stage": "<e.g. Idea Stage/MVP Stage/Early Revenue/Growth Stage>",
    "businessType": "<e.g. B2B/B2C/B2G/SaaS/Hardware>",
    "innovationLevel": "<'Incremental Innovation' | 'Significant Innovation' | 'Deep Technology' | 'Research-Based Innovation'>",
    "schemeMatchReadiness": <0-10>
  },
  "matchedSchemes": [
    {
      "rank": 1,
      "name": "<Official scheme name>",
      "ministry": "<Ministry name>",
      "agency": "<Implementing agency>",
      "category": "<'Grant' | 'Loan' | 'Subsidy' | 'Tax Benefit' | 'Incubation' | 'Recognition'>",
      "status": "<'Active' | 'Upcoming' | 'Rolling'>",
      "fundingAmount": "<e.g. ₹50 Lakhs>",
      "equityFree": <true|false>,
      "relevanceScore": <0-100>,
      "eligibilityStatus": "<'Eligible' | 'Partially Eligible' | 'Not Eligible'>",
      "eligibilityScore": <0-10>,
      "approvalProbability": <0-100>,
      "whyItMatches": "<why this scheme fits, max 10 words>",
      "eligibilityGap": "<what is missing if partial, max 8 words>",
      "applicationDifficulty": "<'Easy' | 'Moderate' | 'Difficult' | 'Highly Competitive'>",
      "link": "<official URL>"
    },
    {
      "rank": 2,
      "name": "<Official scheme name>",
      "ministry": "<Ministry name>",
      "agency": "<Implementing agency>",
      "category": "<'Grant' | 'Loan' | 'Subsidy' | 'Tax Benefit' | 'Incubation' | 'Recognition'>",
      "status": "<'Active' | 'Upcoming' | 'Rolling'>",
      "fundingAmount": "<e.g. ₹10 Lakhs>",
      "equityFree": <true|false>,
      "relevanceScore": <0-100>,
      "eligibilityStatus": "<'Eligible' | 'Partially Eligible' | 'Not Eligible'>",
      "eligibilityScore": <0-10>,
      "approvalProbability": <0-100>,
      "whyItMatches": "<why this scheme fits, max 10 words>",
      "eligibilityGap": "<what is missing if partial, max 8 words>",
      "applicationDifficulty": "<'Easy' | 'Moderate' | 'Difficult' | 'Highly Competitive'>",
      "link": "<official URL>"
    },
    {
      "rank": 3,
      "name": "<Official scheme name>",
      "ministry": "<Ministry name>",
      "agency": "<Implementing agency>",
      "category": "<'Grant' | 'Loan' | 'Subsidy' | 'Tax Benefit' | 'Incubation' | 'Recognition'>",
      "status": "<'Active' | 'Upcoming' | 'Rolling'>",
      "fundingAmount": "<e.g. ₹25 Lakhs>",
      "equityFree": <true|false>,
      "relevanceScore": <0-100>,
      "eligibilityStatus": "<'Eligible' | 'Partially Eligible' | 'Not Eligible'>",
      "eligibilityScore": <0-10>,
      "approvalProbability": <0-100>,
      "whyItMatches": "<why this scheme fits, max 10 words>",
      "eligibilityGap": "<what is missing if partial, max 8 words>",
      "applicationDifficulty": "<'Easy' | 'Moderate' | 'Difficult' | 'Highly Competitive'>",
      "link": "<official URL>"
    }
  ],
  "documentChecklist": {
    "available": ["<doc1>", "<doc2>"],
    "missing": ["<doc1>", "<doc2>"],
    "optional": ["<doc1>"]
  },
  "fundingRoadmap": [
    { "phase": 1, "title": "Immediate Applications", "timeframe": "Now – 30 Days", "action": "<what to do, max 10 words>", "scheme": "<scheme name>" },
    { "phase": 2, "title": "After MVP", "timeframe": "Month 2–4", "action": "<what to do, max 10 words>", "scheme": "<scheme name>" },
    { "phase": 3, "title": "After Validation", "timeframe": "Month 4–8", "action": "<what to do, max 10 words>", "scheme": "<scheme name>" },
    { "phase": 4, "title": "Growth Stage", "timeframe": "Month 8–18", "action": "<what to do, max 10 words>", "scheme": "<scheme name>" }
  ],
  "regulatoryIncentives": [
    { "type": "<e.g. Tax Exemption / Patent Fee Reduction>", "benefit": "<benefit, max 8 words>", "annualSaving": "<₹ amount>" },
    { "type": "<e.g. R&D Deduction / Export Incentive>", "benefit": "<benefit, max 8 words>", "annualSaving": "<₹ amount>" }
  ],
  "alternatives": {
    "incubators": ["<incubator1>", "<incubator2>"],
    "accelerators": ["<accelerator1>", "<accelerator2>"],
    "competitions": ["<competition1>", "<competition2>"]
  },
  "actionPlan": {
    "next7Days": ["<action1, max 8 words>", "<action2, max 8 words>"],
    "next30Days": ["<action1, max 8 words>", "<action2, max 8 words>"],
    "next60Days": ["<action1, max 8 words>"],
    "next90Days": ["<action1, max 8 words>"]
  },
  "scorecard": {
    "schemeMatch": <0-10>,
    "eligibility": <0-10>,
    "approvalProbability": <0-10>,
    "fundingPotential": <0-10>,
    "strategicValue": <0-10>,
    "easeOfApplication": <0-10>
  },
  "totalPotentialFunding": "<total across eligible schemes, e.g. ₹75 Lakhs>",
  "recommendations": {
    "bestSchemeFirst": "<scheme name and why, max 10 words>",
    "highestFundingOpportunity": "<scheme name and amount, max 8 words>",
    "fastestApproval": "<scheme name and timeline, max 8 words>",
    "lowestEffort": "<scheme name and reason, max 8 words>",
    "biggestEligibilityGap": "<what is blocking most schemes, max 10 words>",
    "mostValuableIncentive": "<most valuable non-cash benefit, max 8 words>"
  }
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Idea'}"
Location: "${input.location || 'India'}"
Revenue Model: "${input.revenueModel || 'SaaS'}"`,
  }),


  'cofounder-match': (input) => ({
    system: `You are a startup cofounder match maker. Output ONLY valid JSON. Keep all values extremely short to run under 3 seconds.`,
    user: `Generate co-founder profile. Return ONLY this JSON (exactly 1 target profile):
{
  "skillGapAnalysis": "<gap summary, max 10 words>",
  "idealCoFounderProfile": {
    "primarySkill": "<Most needed skill>",
    "secondarySkill": "<Second most needed skill>",
    "personalityType": "<personality, max 6 words>",
    "equityRange": "<X-Y%>",
    "salaryExpectation": "<expectation, max 6 words>"
  },
  "searchProfiles": [
    {
      "archetype": "<Archetype e.g. 'Tech Builder'>",
      "background": "<background, max 8 words>",
      "whereToFind": "<LinkedIn search query, max 5 words>",
      "greenFlags": ["<signal 1, max 4 words>", "<signal 2, max 4 words>"],
      "redFlags": ["<red flag 1, max 4 words>", "<red flag 2, max 4 words>"]
    }
  ],
  "introEmailTemplate": {
    "subject": "<Email subject, max 6 words>",
    "body": "<concise intro email, max 50 words>"
  },
  "coFounderInterviewQuestions": ["<Q1, max 8 words>", "<Q2, max 8 words>", "<Q3, max 8 words>"],
  "platformsToSearch": [
    {"name": "<Platform>", "strategy": "<strategy, max 6 words>"}
  ],
  "warningSign": "<common mistake, max 10 words>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Pre-Seed'}"`,
  }),
};

export async function runCoFounderModule(input: CoFounderInput): Promise<string> {
  const { system, user } = MODULE_PROMPTS[input.module](input);

  let response = '';
  let success = false;

  if (input.useOllama) {
    try {
      const ollamaUrl = input.ollamaBaseUrl || 'http://127.0.0.1:11434';
      const ollamaModel = input.ollamaModel || 'gemma2:2b';

      console.log(`[CoFounder AI] Attempting local Ollama execution: ${ollamaUrl} (${ollamaModel})`);
      const options = (input.module === 'pitch-deck' || input.module === 'validate' || input.module === 'discovery' || input.module === 'schemes' || input.module === 'hiring')
        ? { numCtx: 4096, numPredict: 3072 }
        : undefined;

      response = await executeOllamaChat(
        ollamaUrl,
        ollamaModel,
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        0.3,
        { type: 'json_object' },
        options
      );
      success = true;
    } catch (err: any) {
      console.warn('[CoFounder AI] Local Ollama execution failed, falling back to Hugging Face cloud Gemma 2b:', err.message || err);
    }
  }

  if (!success) {
    console.log('[CoFounder AI] Running Cloud Gemma 2b via Hugging Face...');
    const { hfClient, PRIMARY_ROUTING_MODEL } = await import('@/ai/huggingface');

    let res;
    try {
      res = await hfClient.chat.completions.create({
        model: PRIMARY_ROUTING_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
    } catch (jsonModeError) {
      console.warn("[CoFounder AI] HF Router JSON mode failed, retrying without response_format:", jsonModeError);
      res = await hfClient.chat.completions.create({
        model: PRIMARY_ROUTING_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.3
      });
    }
    response = res.choices[0]?.message?.content || '';
  }

  // Strip think tags if present
  const cleaned = response
    .replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '')
    .trim()
    .replace(/^```(json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();

  // Validate it's JSON
  JSON.parse(cleaned);
  return cleaned;
}
