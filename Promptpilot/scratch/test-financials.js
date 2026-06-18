// Using global native fetch supported by Node 18+
// Since Node 18+, fetch is available globally!

async function testFinancials() {
  const system = `You are a startup CFO. Output ONLY valid JSON. Keep all values extremely concise to ensure execution under 3 seconds. All amounts in INR.`;

  const idea = "AI-powered automated inventory optimization for Kirana stores in India";
  const user = `Build a 3-year financial model with clear scaling strategies showing exactly how we achieve the numbers. Return ONLY this JSON:
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
    "avgRevenuePerUser_INR": 1000,
    "monthlyGrowthRate": "15%",
    "initialUsers": 100,
    "CAC_INR": 800,
    "LTV_INR": 6000,
    "LTV_CAC_ratio": "7.5:1",
    "monthlyBurnRate_INR": 150000,
    "burnRateBreakdown": {
      "salaries": "50%",
      "infrastructure": "20%",
      "marketing": "20%",
      "operations": "10%"
    }
  },
  "yearlyProjections": [
    { 
      "year": 1, 
      "revenue_INR": 1200000, 
      "expenses_INR": 1800000, 
      "netProfit_INR": -600000, 
      "users": 250, 
      "MRR_INR": 100000,
      "scalingActions": [
        "Launch in 3 dense markets with direct agent onboarding",
        "Monetize transaction commission and launch basic features"
      ]
    },
    { 
      "year": 2, 
      "revenue_INR": 4800000, 
      "expenses_INR": 3600000, 
      "netProfit_INR": 1200000, 
      "users": 1000, 
      "MRR_INR": 400000,
      "scalingActions": [
        "Introduce automated referral loop and partner integrations",
        "Upsell premium analytics SaaS package to top 15% stores"
      ]
    },
    { 
      "year": 3, 
      "revenue_INR": 18000000, 
      "expenses_INR": 12000000, 
      "netProfit_INR": 6000000, 
      "users": 3500, 
      "MRR_INR": 1500000,
      "scalingActions": [
        "Full GTM scale-up into 5 new cities via localized reseller network",
        "Leverage bulk purchase supplier commissions to unlock new streams"
      ]
    }
  ],
  "breakEvenMonth": 14,
  "runwayMonths": 18,
  "fundingNeeded_INR": 2000000,
  "useOfFunds": [
    {"category": "Product Development", "amount_INR": 800000, "percentage": "40%"},
    {"category": "GTM & Marketing", "amount_INR": 800000, "percentage": "40%"},
    {"category": "Operations & Legal", "amount_INR": 400000, "percentage": "20%"}
  ],
  "keyMetrics": {
    "paybackPeriodMonths": 6,
    "grossMargin": "75%",
    "netMargin_Year3": "33%"
  },
  "costCuttingTips": ["Optimize server instances", "Automate invoice reconciliation"]
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
          num_ctx: 2048,
          num_predict: 1024
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
    fs.writeFileSync('C:\\Users\\Welcome\\Downloads\\Promptpilot-main\\Promptpilot\\scratch\\raw-financials-output.txt', content);
    console.log("SUCCESS! Length of output:", content.length);
    
    // Test parsing
    try {
      const parsed = JSON.parse(content);
      console.log("Parsed successfully! Year projections count:", parsed.yearlyProjections ? parsed.yearlyProjections.length : "none");
      console.log("Monetization plans count:", parsed.monetizationPlan ? parsed.monetizationPlan.length : "none");
      console.log("Growth playbook items count:", parsed.growthPlaybook ? parsed.growthPlaybook.length : "none");
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testFinancials();
