// Using global native fetch supported by Node 18+
// Since Node 18+, fetch is available globally!

async function testOllama() {
  const system = `You are a legendary venture capitalist and world-class pitch deck architect. Your mission is to generate a highly detailed, persuasive, investor-ready 10-slide pitch deck designed to secure the startup's first major investor. The deck must be structured exactly around the startup idea evaluation and market validation metrics.
Output ONLY valid JSON. Every value in the JSON MUST be highly detailed, professional, and contain realistic data/metrics relevant to the industry. Do NOT use generic placeholder words. Bullet points in "content" should use standard markdown (e.g. "- **Bold Title**: Description of point") and separate bullets with actual newlines (\\n). Do NOT use raw HTML tags (like <br/>, <b>, etc.). Each slide MUST contain all keys: "slideNumber", "layout", "title", "headline", "content", and "speakerNote".`;

  const idea = "AI-powered automated inventory optimization for Kirana stores in India";
  const user = `Generate a comprehensive, investor-ready 10-slide pitch deck following the structure of our idea evaluation. Return ONLY a valid JSON object matching this schema structure:
{
  "deckTitle": "<Creative and professional name for the startup>",
  "tagline": "<Powerful elevator pitch/tagline, max 12 words>",
  "slides": [
    {
      "slideNumber": 1,
      "layout": "cover",
      "title": "Title / Vision",
      "headline": "<Inspiring headline outlining the core vision>",
      "content": "- **Vision**: <First high-impact bullet describing the company's bold vision>\\n- **Mission**: <Second bullet outlining the core mission and who it serves>\\n- **Market Opportunity**: <Third bullet detailing the massive industry shift or opportunity>",
      "speakerNote": "<Speaker script guiding how to open the pitch, max 25 words>"
    },
    {
      "slideNumber": 2,
      "layout": "verdict",
      "title": "Idea Verdict",
      "headline": "<Our market validation verdict and confidence scoring>",
      "content": "- **Validation Score**: <Confidence score as a number, e.g. 85/100, and a brief description of why it scores this high>\\n- **Market Verdict**: <Overall demand verdict, e.g. HIGH DEMAND, and target validation summary>\\n- **Brutal Honesty**: <Brutally honest market entry assessment and reality check>",
      "speakerNote": "<Speaker script detailing the core validation score and initial demand check, max 25 words>"
    },
    {
      "slideNumber": 3,
      "layout": "market-size",
      "title": "Market Size",
      "headline": "<Bottom-up estimation of our addressable market sizing in INR>",
      "content": "- **Total Addressable Market (TAM)**: <TAM estimation with specific numbers, e.g. ₹45,000 Cr, and description>\\n- **Serviceable Addressable Market (SAM)**: <SAM estimation with specific numbers, e.g. ₹5,000 Cr, and description>\\n- **Serviceable Obtainable Market (SOM)**: <SOM estimation with specific numbers, e.g. ₹500 Cr, target for Year 2-3>",
      "speakerNote": "<Speaker note detailing how we calculate TAM/SAM/SOM bottom-up based on target users and pricing, max 25 words>"
    },
    {
      "slideNumber": 4,
      "layout": "opportunities",
      "title": "Opportunities",
      "headline": "<Core market tailwinds and growth opportunities we leverage>",
      "content": "- **Opportunity A**: <First major opportunity, e.g. digitalization, smartphone penetration or regulatory shifts>\\n- **Opportunity B**: <Second major opportunity, e.g. unorganized sector inefficiencies or cost reduction loops>\\n- **Opportunity C**: <Third major opportunity, e.g. supply chain integration or cross-selling financial services>",
      "speakerNote": "<Speaker note summarizing our unfair advantages and tailwinds we are riding, max 25 words>"
    },
    {
      "slideNumber": 5,
      "layout": "niche",
      "title": "Suggested Niche",
      "headline": "<Our specific target market segment and entry strategy>",
      "content": "- **Target Customer**: <Detailed description of our target segment/niche focus, e.g., tier-2 unorganized retailers>\\n- **Underserved Need**: <Why traditional competitors ignore this niche or fail to address their specific pain points>\\n- **Launch Strategy**: <How we plan to capture 20%+ of this specific niche before expanding to broader markets>",
      "speakerNote": "<Speaker note detailing our razor-sharp focus on the initial niche to build immediate density, max 25 words>"
    },
    {
      "slideNumber": 6,
      "layout": "signals",
      "title": "Market Signals",
      "headline": "<Active customer interest and search behavior validating demand>",
      "content": "- **Reddit Signal**: <Social listening data, sentiment percentage, e.g. 75% Positive, and typical user feedback/frustrations>\\n- **Google Trends**: <Search volume growth percentage, e.g. Rising (+20% YoY), and keyword search patterns showing demand>",
      "speakerNote": "<Speaker note explaining how real-world search trends and social communities validate our value prop, max 25 words>"
    },
    {
      "slideNumber": 7,
      "layout": "risks",
      "title": "Key Risks",
      "headline": "<Market entry hurdles and our strategic mitigation plans>",
      "content": "- **Risk A / Threat**: <First critical risk, e.g. slow user onboarding or low digital literacy, and how we mitigate it>\\n- **Risk B / Threat**: <Second critical risk, e.g. high collection/logistics costs or churn, and how we mitigate it>",
      "speakerNote": "<Speaker note explaining our proactive risk management and mitigation strategies, max 25 words>"
    },
    {
      "slideNumber": 8,
      "layout": "govt-schemes",
      "title": "Govt Schemes & Funding",
      "headline": "<Eligible non-dilutive government schemes and grants>",
      "content": "- **DPIIT Recognition**: <Tax exemptions, IP/patent assistance, and fast-track registration benefits>\\n- **Matched Schemes**: <Specific schemes matched, e.g. Startup India Seed Fund (SISFS) up to ₹50L or NIDHI-PRAYAS (₹10L)>\\n- **Incentive Strategy**: <How we leverage government subsidies and incubation networks to extend our runway>",
      "speakerNote": "<Speaker note highlighting how we leverage non-dilutive government funding to accelerate early scale, max 25 words>"
    },
    {
      "slideNumber": 9,
      "layout": "action-plan",
      "title": "Action Plan",
      "headline": "<Immediate validation milestones to launch and scale>",
      "content": "- **Step 1: Customer Discovery**: <Target responses, customer interviews, and validating our niche persona>\\n- **Step 2: MVP Development**: <Building initial pilot product, setting up WhatsApp/simple workflows, and beta trial>\\n- **Step 3: Pilot Launch & Scale**: <Acquiring first 100 paid users, establishing unit economics, and preparing for Seed ask>",
      "speakerNote": "<Speaker note showing our clear execution schedule and immediate next validation steps, max 25 words>"
    },
    {
      "slideNumber": 10,
      "layout": "contact",
      "title": "Contact / Next Steps",
      "headline": "<Join us in validating and building this high-potential opportunity>",
      "content": "- **Contact Name**: <Presenter Name, e.g. Co-Founder & CEO Name>\\n- **Email Address**: <Professional startup email contact, e.g. hello@startup.com>\\n- **Phone & Social**: <Phone number and LinkedIn URL placeholder, e.g., +91 99999 99999 | linkedin.com/in/startup>",
      "speakerNote": "<Speaker note closing the pitch with a strong call-to-action and final vision reminder, max 25 words>"
    }
  ],
  "investorFitNote": "<Strategic investor alignment note matching target VC/angel profiles, max 30 words>"
}

Startup Context:
- Idea: "${idea}"
- Sector: "Retail / SaaS"
- Stage: "Pre-Seed"
- Revenue Model: "SaaS & Commission"
- Target Market: "India"
- Team Size: "Just founders"
- Location: "India"`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  try {
    console.log("Sending request to Ollama...");
    const res = await fetch("http://127.0.0.1:11434/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma2:2b",
        messages: messages,
        temperature: 0.3,
        response_format: { type: "json_object" },
        options: {
          num_ctx: 4096, // Let's try 4096 context window
          num_predict: 2048 // Let's try 2048 output tokens
        }
      })
    });
    
    if (!res.ok) {
      console.error("HTTP Error:", res.status, await res.text());
      return;
    }
    const data = await res.json();
    const content = data.choices[0].message.content;
    const fs = require('fs');
    fs.writeFileSync('C:\\Users\\Welcome\\Downloads\\Promptpilot-main\\Promptpilot\\scratch\\raw-ollama-output.txt', content);
    console.log("SUCCESS! Length of output:", content.length);
    
    // Test parsing
    try {
      const parsed = JSON.parse(content);
      console.log("Parsed successfully! Slide count:", parsed.slides ? parsed.slides.length : "none");
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testOllama();
