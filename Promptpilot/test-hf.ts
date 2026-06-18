import { config } from 'dotenv';
config({ path: '.env.local' });

async function test() {
  const model = "gpt2";
  console.log(`Testing direct fetch for Serverless model: ${model}...`);
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "x-wait-for-model": "true"
      },
      body: JSON.stringify({
        inputs: "Explain quantum computing in one sentence."
      })
    });

    const text = await response.text();
    console.log("Response status:", response.status);
    console.log("Response text:", text);
  } catch (e: any) {
    console.log("Fetch failed:", e.message);
  }
}

test();
