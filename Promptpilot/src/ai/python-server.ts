'use server';

export async function executePythonChat(
  baseURL: string,
  messages: Array<{ role: string; content: string | any[] }>,
  temperature: number = 0.7
): Promise<string> {
  const cleanUrl = baseURL.trim() || 'http://127.0.0.1:8000';

  try {
    const chatUrl = `${cleanUrl}/v1/chat/completions`;
    console.log(`[Python Client] Directing request to: ${chatUrl}`);

    // Map content to string format since python server expects text
    const cleanMessages = messages.map(msg => {
      let textContent = '';
      if (typeof msg.content === 'string') {
        textContent = msg.content;
      } else if (Array.isArray(msg.content)) {
        // Handle multimodal content array
        textContent = msg.content
          .map(c => {
            if (typeof c === 'string') return c;
            if (c && typeof c === 'object' && 'text' in c) return c.text;
            return '';
          })
          .join('\n');
      }
      return {
        role: msg.role,
        content: textContent,
      };
    });

    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: cleanMessages,
        temperature,
      }),
      // 120 seconds timeout as local python model loading and generation can be slow
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Python Server HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error(`Python Server response payload did not contain message content.`);
    }

    return content;
  } catch (error: any) {
    console.error('[Python Client Error]:', error);

    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      throw new Error(
        `Python Server request timed out after 120 seconds. Running models locally via Hugging Face requires substantial resources. Please make sure your system has enough free RAM and GPU resources.`
      );
    }

    if (
      error.code === 'ECONNREFUSED' || 
      error.message?.includes('fetch failed') || 
      error.message?.includes('Failed to fetch')
    ) {
      throw new Error(
        `Could not connect to the local Python Transformers service at ${cleanUrl}. \n\n` +
        `Please verify that: \n` +
        `1. The server is running (run 'python gemma_server.py' in your terminal).\n` +
        `2. The Hugging Face model files have finished downloading.\n` +
        `3. The Python Server URL in Settings matches your local service port.`
      );
    }

    throw new Error(`Local Transformers execution failed: ${error.message || error}`);
  }
}
