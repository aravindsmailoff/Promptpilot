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

  let response = '';
  let success = false;

  if (input.useOllama) {
    try {
      const ollamaUrl = input.ollamaBaseUrl || 'http://127.0.0.1:11434';
      const ollamaModel = input.ollamaModel || 'gemma2:2b';

      console.log(`[CoFounder AI] Attempting local Ollama execution: ${ollamaUrl} (${ollamaModel})`);
      const options = input.module === 'pitch-deck'
        ? { numCtx: 4096, numPredict: 2048 }
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
