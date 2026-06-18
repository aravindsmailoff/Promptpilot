import { config } from 'dotenv';
config({ path: '.env.local' });
import { OpenAI } from 'openai';

async function main() {
  console.log("Initializing OpenAI client with API Key:", process.env.HF_TOKEN ? "Present (starts with " + process.env.HF_TOKEN.slice(0, 7) + ")" : "Missing");
  
  const client = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN,
  });

  try {
    console.log("Sending chat completion request to Qwen/Qwen2.5-7B-Instruct...");
    const response = await client.chat.completions.create({
      model: "Qwen/Qwen2.5-7B-Instruct",
      messages: [
        { role: "user", content: "Hello, are you online?" }
      ],
      max_tokens: 10
    });
    console.log("Success! Response:");
    console.log(JSON.stringify(response, null, 2));
  } catch (error: any) {
    console.error("Error occurred:");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Cause:", error.cause);
    console.error("Stack:", error.stack);
  }
}

main();
