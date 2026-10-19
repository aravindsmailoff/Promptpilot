'use server';

export async function executeOllamaChat(
  baseURL: string,
  model: string,
  messages: Array<{ role: string; content: string | any[] }>,
  temperature: number = 0.7,
  responseFormat?: { type: 'json_object' },
  options?: { numCtx?: number; numPredict?: number }
): Promise<string> {
  let targetUrl = baseURL.trim() || 'http://127.0.0.1:11434';
  const ollamaModel = model.trim() || 'qwen3.5:2b';

  // In cloud serverless (Vercel), resolve localhost to process.env.OLLAMA_BASE_URL if configured
  const isCloud = process.env.VERCEL === '1' || 
    Boolean(process.env.VERCEL_ENV) || 
    Boolean(process.env.VERCEL_URL) || 
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (isCloud && (targetUrl.includes('127.0.0.1') || targetUrl.includes('localhost'))) {
    if (process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_BASE_URL.includes('127.0.0.1') && !process.env.OLLAMA_BASE_URL.includes('localhost')) {
      targetUrl = process.env.OLLAMA_BASE_URL.trim();
    } else {
      throw new Error('Vercel cloud server cannot connect directly to 127.0.0.1. Please enter your secure Ollama Tunnel URL (from cloudflared/ngrok) in Settings or set OLLAMA_BASE_URL in Vercel.');
    }
  }

  try {
    const chatUrl = `${targetUrl}/api/chat`;
    console.log(`[Ollama Client] Directing request to: ${chatUrl} (Model: ${ollamaModel}, think: false, GPU: 100%)`);

    // Format messages for Ollama API (ensures message.content is a string, moves images to .images)
    const formattedMessages = messages.map(msg => {
      if (typeof msg.content === 'string') {
        return msg;
      }
      if (Array.isArray(msg.content)) {
        let textParts = '';
        const images: string[] = [];
        for (const part of msg.content) {
          if (part.type === 'text' && part.text) {
            textParts += (textParts ? '\n' : '') + part.text;
          } else if (part.type === 'image_url' && part.image_url?.url) {
            const base64Data = part.image_url.url.replace(/^data:image\/[a-z]+;base64,/, '');
            images.push(base64Data);
          }
        }
        return {
          role: msg.role,
          content: textParts,
          ...(images.length > 0 ? { images } : {})
        };
      }
      return {
        role: msg.role,
        content: String(msg.content ?? '')
      };
    });

    const requestBody: any = {
      model: ollamaModel,
      messages: formattedMessages,
      stream: false,
      think: false, // Turn off slow multi-paragraph internal reasoning
      options: {
        num_ctx: options?.numCtx ?? 2048, // Optimize context size to fit 100% in RTX 3050 VRAM
        num_predict: options?.numPredict ?? 600, // Keep responses focused and swift (under 10s)
        num_gpu: 99, // Offload 100% of model layers to GPU
        temperature,
      }
    };

    if (responseFormat?.type === 'json_object') {
      requestBody.format = 'json';
    }

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      // 60 seconds timeout for neural inference across tunnel
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text();
      try {
        const parsed = JSON.parse(errText);
        const errMsg = parsed.error?.message || parsed.error || '';
        const errType = parsed.error?.type || '';

        // Model not downloaded yet
        if (
          errType === 'not_found_error' ||
          errMsg.toLowerCase().includes('not found') ||
          (errMsg.toLowerCase().includes('model') && errMsg.toLowerCase().includes('not found'))
        ) {
          throw new Error(
            `The model '${ollamaModel}' was not found in your local Ollama installation.\n\n` +
            `To fix this, run the following command in your terminal:\n` +
            `   ollama pull ${ollamaModel}\n\n` +
            `Once the download completes, try again.`
          );
        }

        if (errMsg.includes('requires more system memory') || errMsg.includes('requires more memory')) {
          throw new Error(
            `The local model '${ollamaModel}' requires more memory than is currently available on your machine.\n\n` +
            `To resolve this, please try closing other heavy applications to free up system memory.`
          );
        }
      } catch (e: any) {
        if (
          e.message.includes('not found') ||
          e.message.includes('requires more memory')
        ) {
          throw e;
        }
      }
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let content = data.message?.content ?? data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error(`Ollama response payload did not contain message content.`);
    }

    // Strip internal thinking tags (<think>...</think> or <thought>...</thought>) if any exist
    content = content.replace(/<(think|thought)>[\s\S]*?<\/\1>/g, '').trim();

    return content;
  } catch (error: any) {
    console.error('[Ollama Client Error]:', error);

    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new Error(
        `Ollama request timed out after 300 seconds. Running models locally requires substantial CPU/GPU resources. Please make sure your system has enough free RAM and that '${ollamaModel}' isn't overloaded.`
      );
    }

    // Capture connection refused or fetch failures
    if (
      error.code === 'ECONNREFUSED' || 
      error.message?.includes('fetch failed') || 
      error.message?.includes('Failed to fetch')
    ) {
      throw new Error(
        `Could not connect to the local Ollama service at ${cleanUrl}. \n\n` +
        `Please verify that: \n` +
        `1. Ollama is installed and running (run 'ollama serve' or open the Ollama desktop app).\n` +
        `2. You have downloaded the model in your terminal using: 'ollama pull ${ollamaModel}'.\n` +
        `3. The Ollama API URL in Settings matches your local service port.`
      );
    }

    throw new Error(`Local LLM execution failed: ${error.message || error}`);
  }
}
