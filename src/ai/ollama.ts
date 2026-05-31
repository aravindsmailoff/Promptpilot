'use server';

export async function executeOllamaChat(
  baseURL: string,
  model: string,
  messages: Array<{ role: string; content: string | any[] }>,
  temperature: number = 0.7,
  responseFormat?: { type: 'json_object' }
): Promise<string> {
  const cleanUrl = baseURL.trim() || 'http://127.0.0.1:11434';
  const ollamaModel = model.trim() || 'gemma2:2b';

  try {
    const chatUrl = `${cleanUrl}/v1/chat/completions`;
    console.log(`[Ollama Client] Directing request to: ${chatUrl} (Model: ${ollamaModel})`);

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        temperature,
        response_format: responseFormat,
        stream: false,
      }),
      // 60 seconds timeout to prevent hanging on slower machines during local inference
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text();
      try {
        const parsed = JSON.parse(errText);
        const errMsg = parsed.error?.message || '';
        const errType = parsed.error?.type || '';

        // Model not downloaded yet
        if (
          errType === 'not_found_error' ||
          errMsg.toLowerCase().includes('not found') ||
          errMsg.toLowerCase().includes('model') && errMsg.toLowerCase().includes('not found')
        ) {
          throw new Error(
            `The model '${ollamaModel}' was not found in your local Ollama installation.\n\n` +
            `To fix this, run the following command in your terminal:\n` +
            `   ollama pull ${ollamaModel}\n\n` +
            `Once the download completes, try again. If you want a lighter model, ` +
            `try 'ollama pull gemma2:2b' and update the Active Model Tag in Settings.`
          );
        }

        if (errMsg.includes('requires more system memory') || errMsg.includes('requires more memory')) {
          throw new Error(
            `The local model '${ollamaModel}' requires more memory than is currently available on your machine.\n\n` +
            `To resolve this, please try one of the following:\n` +
            `1. Close other RAM-heavy applications to free up system memory.\n` +
            `2. Run a lighter, highly-optimized model. We recommend pulling 'gemma2:2b' (approx. 1.6 GB):\n` +
            `   Run 'ollama pull gemma2:2b' in your terminal.\n` +
            `   Then go to Settings in PromptPilot and update the Active Model Tag to 'gemma2:2b'.`
          );
        }
      } catch (e: any) {
        if (
          e.message.includes('not found') ||
          e.message.includes('requires more memory') ||
          e.message.includes('gemma2:2b')
        ) {
          throw e;
        }
      }
      throw new Error(`Ollama HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error(`Ollama response payload did not contain message content.`);
    }

    return content;
  } catch (error: any) {
    console.error('[Ollama Client Error]:', error);

    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new Error(
        `Ollama request timed out after 60 seconds. Running models locally requires substantial CPU/GPU resources. Please make sure your system has enough free RAM and that '${ollamaModel}' isn't overloaded.`
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
