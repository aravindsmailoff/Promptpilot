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
    system: `You are a brutally honest startup analyst with deep knowledge of Indian and global markets.
Provide data-driven, no-fluff validation reports. Output ONLY valid JSON. Keep ALL descriptions extremely brief (under 10 words per value) to ensure generation takes under 3 seconds.
If validationScore >= 60, set qualifiesForGovtFunding to true, name Indian schemes, and urge applying for recognition.`,
    user: `Validate this startup and return ONLY this JSON:
{
  "validationScore": <number 0-100>,
  "verdict": "<'HIGH DEMAND' | 'MODERATE DEMAND' | 'LOW DEMAND' | 'SATURATED MARKET'>",
  "brutalHonesty": "<1 sentence assessment, max 12 words>",
  "marketSize": {
    "TAM": "<TAM in INR, e.g. ₹500 Cr>",
    "SAM": "<SAM in INR>",
    "SOM": "<SOM in INR>"
  },
  "competitorCount": <number>,
  "keyRisks": ["<risk1, max 5 words>", "<risk2, max 5 words>"],
  "keyOpportunities": ["<opportunity1, max 5 words>", "<opportunity2, max 5 words>"],
  "suggestedNiche": "<niche, max 5 words>",
  "redditSignal": "<e.g. 'Positive (70%): Strong interest'>",
  "googleTrendSignal": "<e.g. 'Rising (+15% YoY)'>",
  "validationSteps": ["<step1, max 6 words>", "<step2, max 6 words>"],
  "qualifiesForGovtFunding": <true|false>,
  "govtFundingReason": "<reason and schemes, max 15 words, urge applying>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Not specified'}"
Stage: "${input.stage || 'Idea'}"
Target Market: "${input.targetMarket || 'India'}"`,
  }),

  competitors: (input) => ({
    system: `You are a competitive intelligence analyst specializing in Indian startup ecosystems.
Output ONLY valid JSON. Keep all descriptions under 5 words per field to ensure under 3-second execution.`,
    user: `Generate competitor analysis. Return ONLY this JSON (include exactly 2 key competitors):
{
  "competitors": [
    {
      "name": "<Company name>",
      "type": "<'Direct' | 'Indirect'>",
      "founded": "<year>",
      "funding": "<funding or 'Bootstrapped'>",
      "pricing": "<pricing range>",
      "keyFeature": "<key feature, max 5 words>",
      "weakness": "<weakness, max 5 words>",
      "geography": "<primary market>",
      "website": "<URL>"
    }
  ],
  "differentiationStrategy": "<differentiation strategy, max 12 words>",
  "blueOceanOpportunity": "<untapped angle, max 12 words>",
  "pricingRecommendation": "<recommended pricing, max 6 words>",
  "winCondition": "<win condition, max 10 words>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"`,
  }),

  'pitch-deck': (input) => ({
    system: `You are a top-tier startup pitch coach. Output ONLY valid JSON. Keep all values extremely concise (max 2 bullet points per slide, max 5 words per bullet) to generate under 3 seconds.`,
    user: `Generate a compact 5-slide investor pitch deck. Return ONLY this JSON:
{
  "deckTitle": "<Startup name>",
  "tagline": "<One short line, max 8 words>",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Problem",
      "headline": "<Problem statement, max 6 words>",
      "content": "<2 short bullets of max 5 words each>",
      "speakerNote": "<1 short sentence, max 10 words>"
    },
    {
      "slideNumber": 2,
      "title": "Solution",
      "headline": "<Solution statement, max 6 words>",
      "content": "<2 short bullets of max 5 words each>",
      "speakerNote": "<1 short sentence, max 10 words>"
    },
    {
      "slideNumber": 3,
      "title": "Market Size",
      "headline": "<Market size, max 6 words>",
      "content": "<2 short bullets of max 5 words each>",
      "speakerNote": "<1 short sentence, max 10 words>"
    },
    {
      "slideNumber": 4,
      "title": "Business Model",
      "headline": "<Business model, max 6 words>",
      "content": "<2 short bullets of max 5 words each>",
      "speakerNote": "<1 short sentence, max 10 words>"
    },
    {
      "slideNumber": 5,
      "title": "Ask",
      "headline": "<Funding ask, max 6 words>",
      "content": "<2 short bullets of max 5 words each>",
      "speakerNote": "<1 short sentence, max 10 words>"
    }
  ],
  "investorFitNote": "<investor targeting, max 12 words>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Pre-Seed'}"
Revenue Model: "${input.revenueModel || 'SaaS'}"`,
  }),

  discovery: (input) => ({
    system: `You are a customer discovery expert. Output ONLY valid JSON. Keep all answers extremely short and concise to run under 3 seconds.`,
    user: `Generate customer discovery plan. Return ONLY this JSON (exactly 1 target persona and 3 questions):
{
  "targetPersonas": [
    {
      "name": "<Persona name>",
      "age": "<age range>",
      "role": "<job role>",
      "painPoints": ["<pain1, max 4 words>", "<pain2, max 4 words>"],
      "goals": ["<goal1, max 4 words>", "<goal2, max 4 words>"],
      "whereToFind": ["<channel1>", "<channel2>"],
      "willingnessToPay": "<low/med/high with brief reason, max 6 words>"
    }
  ],
  "discoveryQuestions": [
    {"question": "<Question 1, max 10 words>", "purpose": "<purpose, max 5 words>"},
    {"question": "<Question 2, max 10 words>", "purpose": "<purpose, max 5 words>"},
    {"question": "<Question 3, max 10 words>", "purpose": "<purpose, max 5 words>"}
  ],
  "distributionPlan": {
    "channels": ["<channel 1>", "<channel 2>"],
    "expectedResponseRate": "<X-Y%>",
    "targetResponses": <number>,
    "timelineWeeks": <number>
  },
  "validationThreshold": "<action signal, max 10 words>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Target Market: "${input.targetMarket || 'India'}"`,
  }),

  financials: (input) => ({
    system: `You are a startup CFO. Output ONLY valid JSON. Keep all values extremely concise to ensure execution under 3 seconds. All amounts in INR.`,
    user: `Build a 3-year financial model. Return ONLY this JSON:
{
  "revenueModel": "<Revenue model, max 3 words>",
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
    { "year": 1, "revenue_INR": <number>, "expenses_INR": <number>, "netProfit_INR": <number>, "users": <number>, "MRR_INR": <number> },
    { "year": 2, "revenue_INR": <number>, "expenses_INR": <number>, "netProfit_INR": <number>, "users": <number>, "MRR_INR": <number> },
    { "year": 3, "revenue_INR": <number>, "expenses_INR": <number>, "netProfit_INR": <number>, "users": <number>, "MRR_INR": <number> }
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
    system: `You are a startup hiring expert. Output ONLY valid JSON. Keep all descriptions extremely concise to run under 3 seconds.`,
    user: `Generate hiring plan. Return ONLY this JSON (exactly 1 priority hire):
{
  "hiringPhilosophy": "<philosophy, max 10 words>",
  "priorityHires": [
    {
      "priority": 1,
      "role": "<Job title>",
      "whyFirst": "<reason, max 6 words>",
      "salaryRange_INR": "<X-Y LPA>",
      "mustHaveSkills": ["<skill1>", "<skill2>"],
      "niceToHave": ["<skill1>", "<skill2>"],
      "redFlags": ["<red flag 1, max 4 words>", "<red flag 2, max 4 words>"],
      "whereToFind": ["<platform1>", "<platform2>"],
      "equityRange": "<X-Y%>"
    }
  ],
  "jobDescriptionTemplate": {
    "role": "<Critical first hire role>",
    "aboutUs": "<about us, max 10 words>",
    "whatYoullDo": ["<responsibility 1, max 5 words>", "<responsibility 2, max 5 words>"],
    "whatWeLookFor": ["<requirement 1, max 5 words>", "<requirement 2, max 5 words>"],
    "whatWeOffer": ["<perk 1, max 5 words>", "<perk 2, max 5 words>"]
  },
  "hiringMistakesToAvoid": ["<mistake 1, max 5 words>", "<mistake 2, max 5 words>"],
  "freeHiringPlatforms": ["<platform 1>", "<platform 2>"],
  "interviewProcess": ["<step 1, max 4 words>", "<step 2, max 4 words>"]
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Pre-Seed'}"
Team Size: "${input.teamSize || 'Just founders'}"`,
  }),

  schemes: (input) => ({
    system: `You are an expert in Indian government startup schemes. Output ONLY valid JSON. Keep all values extremely concise to execute under 3 seconds.`,
    user: `Match startup to government schemes. Return ONLY this JSON (exactly 2 matched schemes):
{
  "eligibilitySummary": "<brief summary, max 10 words>",
  "topRecommendation": "<scheme name and brief reason, max 10 words>",
  "matchedSchemes": [
    {
      "name": "<Scheme name>",
      "agency": "<Agency name>",
      "amount": "<Funding amount>",
      "type": "<Grant/Loan/Recognition/Incubation>",
      "fitScore": <0-100>,
      "fitReason": "<reason, max 6 words>",
      "applicationSteps": ["<step 1, max 5 words>", "<step 2, max 5 words>"],
      "deadline": "<Deadline/Rolling>",
      "link": "<URL>",
      "urgency": "<Apply Now/Apply This Month>"
    },
    {
      "name": "<Scheme name>",
      "agency": "<Agency name>",
      "amount": "<Funding amount>",
      "type": "<Grant/Loan/Recognition/Incubation>",
      "fitScore": <0-100>,
      "fitReason": "<reason, max 6 words>",
      "applicationSteps": ["<step 1, max 5 words>", "<step 2, max 5 words>"],
      "deadline": "<Deadline/Rolling>",
      "link": "<URL>",
      "urgency": "<Apply Now/Apply This Month>"
    }
  ],
  "firstStepToday": "<action today, max 10 words>",
  "dpiitRegistrationGuide": {
    "isRequired": <true|false>,
    "benefit": "<benefit, max 6 words>",
    "howToApply": "<steps, max 10 words>"
  },
  "estimatedTotalFunding_INR": "<Total funding, e.g. ₹50L>"
}

Startup Idea: "${input.idea}"
Sector: "${input.sector || 'Technology'}"
Stage: "${input.stage || 'Idea'}"
Location: "${input.location || 'India'}"`,
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

  const ollamaUrl = input.ollamaBaseUrl || 'http://127.0.0.1:11434';
  const ollamaModel = input.ollamaModel || 'gemma2:2b';

  const response = await executeOllamaChat(
    ollamaUrl,
    ollamaModel,
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    0.3,
    { type: 'json_object' }
  );

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
