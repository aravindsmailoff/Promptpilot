const { runCoFounderModule } = require('../src/ai/flows/cofounder-flow');

async function test() {
  try {
    console.log("Running local Gemma Competitor Intel module...");
    const start = Date.now();
    const resultJson = await runCoFounderModule({
      module: 'competitors',
      idea: 'AI Interview Preparation Platform',
      sector: 'EdTech / AI',
      stage: 'Seed',
      useOllama: true,
      ollamaBaseUrl: 'http://127.0.0.1:11434',
      ollamaModel: 'gemma2:2b'
    });
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Success! Taken ${duration}s.`);
    const parsed = JSON.parse(resultJson);
    console.log("Competitors Count:", parsed.competitors?.length);
    console.log("Competitors:", JSON.stringify(parsed.competitors, null, 2));
    console.log("Strategic Insights:", {
      differentiationStrategy: parsed.differentiationStrategy,
      blueOceanOpportunity: parsed.blueOceanOpportunity,
      pricingRecommendation: parsed.pricingRecommendation,
      winCondition: parsed.winCondition
    });
  } catch (e) {
    console.error("Error executing Gemma:", e);
  }
}

test();
