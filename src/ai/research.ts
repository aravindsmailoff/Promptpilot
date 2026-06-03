'use server';

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

export interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  instantAnswer?: string;
  researchContext: string;
}

// Fetch any webpage as clean text via Jina.ai reader (free, no API key)
async function fetchViaJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(jinaUrl, {
    headers: { 'Accept': 'text/plain', 'X-No-Cache': 'true' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Jina fetch failed for ${url}: ${res.status}`);
  const text = await res.text();
  // Trim to 3500 chars to avoid token overflow with Ollama
  return text.slice(0, 3500).trim();
}

// DuckDuckGo Instant Answer API (free, no API key required)
async function getDDGData(query: string): Promise<{
  instant?: string;
  sources: ResearchSource[];
}> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return { sources: [] };

    const data = await res.json();
    const sources: ResearchSource[] = [];
    const instant = (data.AbstractText || data.Answer || '').trim();

    if (data.AbstractURL && data.AbstractText) {
      sources.push({
        title: data.AbstractSource || 'Wikipedia',
        url: data.AbstractURL,
        snippet: data.AbstractText.slice(0, 200),
      });
    }

    // Collect related topic URLs
    const topics: any[] = data.RelatedTopics || [];
    for (const topic of topics.slice(0, 5)) {
      if (topic.FirstURL && topic.Text && topic.Text.length > 20) {
        sources.push({
          title: topic.Text.slice(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text.slice(0, 200),
        });
      }
      // Handle nested topic groups
      if (topic.Topics) {
        for (const sub of (topic.Topics as any[]).slice(0, 2)) {
          if (sub.FirstURL && sub.Text) {
            sources.push({
              title: sub.Text.slice(0, 80),
              url: sub.FirstURL,
              snippet: sub.Text.slice(0, 200),
            });
          }
        }
      }
    }

    return { instant: instant || undefined, sources };
  } catch (err) {
    console.warn('[Research] DDG lookup failed:', err);
    return { sources: [] };
  }
}

// Wikipedia summary API (free, no key)
async function getWikipediaSummary(topic: string): Promise<ResearchSource | null> {
  try {
    const slug = topic.replace(/\s+/g, '_');
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type === 'disambiguation' || !data.extract) return null;
    return {
      title: data.title,
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${slug}`,
      snippet: data.extract.slice(0, 500),
      content: data.extract,
    };
  } catch {
    return null;
  }
}

// Main research function — orchestrates all sources
export async function conductResearch(query: string): Promise<ResearchResult> {
  console.log(`[Research] Starting research for: "${query}"`);

  const results = await Promise.allSettled([
    getDDGData(query),
    getWikipediaSummary(query),
  ]);

  const ddgData = results[0].status === 'fulfilled' ? results[0].value : { sources: [] };
  const wikiSource = results[1].status === 'fulfilled' ? results[1].value : null;

  const allSources: ResearchSource[] = [];

  // Add Wikipedia as first source if available
  if (wikiSource) allSources.push(wikiSource);

  // Add DDG sources
  for (const src of ddgData.sources) {
    if (!allSources.find(s => s.url === src.url)) {
      allSources.push(src);
    }
  }

  // Enrich top 2 sources with full page content via Jina.ai
  const enriched = await Promise.allSettled(
    allSources.slice(0, 2).map(async (src) => {
      // Skip DuckDuckGo's own pages
      if (src.url.includes('duckduckgo.com')) return src;
      try {
        const content = await fetchViaJina(src.url);
        return { ...src, content };
      } catch {
        return src;
      }
    })
  );

  const enrichedSources = enriched
    .filter((r): r is PromiseFulfilledResult<ResearchSource> => r.status === 'fulfilled')
    .map(r => r.value);

  // Merge enriched with remaining sources
  const finalSources = [
    ...enrichedSources,
    ...allSources.slice(enrichedSources.length),
  ];

  // Build research context string for Ollama injection
  let researchContext = '';

  if (ddgData.instant) {
    researchContext += `## INSTANT ANSWER\n${ddgData.instant}\n\n`;
  }

  finalSources.forEach((src, i) => {
    researchContext += `## SOURCE ${i + 1}: ${src.title}\nURL: ${src.url}\n`;
    if (src.content) {
      researchContext += `FULL CONTENT:\n${src.content}\n\n`;
    } else if (src.snippet) {
      researchContext += `EXCERPT: ${src.snippet}\n\n`;
    }
  });

  if (!researchContext.trim()) {
    researchContext = 'No live web data retrieved. Synthesizing from training knowledge with high confidence.';
  }

  console.log(`[Research] Complete. ${finalSources.length} sources found.`);

  return {
    query,
    sources: finalSources,
    instantAnswer: ddgData.instant,
    researchContext,
  };
}

// Build the enriched prompt for Ollama
export async function buildResearchPrompt(originalPrompt: string, research: ResearchResult): Promise<string> {
  if (research.sources.length === 0) return originalPrompt;

  return `=== LIVE RESEARCH DATA ===
${research.researchContext}
=== END RESEARCH DATA ===

USER QUERY: ${originalPrompt}

Using the research data above as your primary source, provide a comprehensive, cited answer.`;
}
