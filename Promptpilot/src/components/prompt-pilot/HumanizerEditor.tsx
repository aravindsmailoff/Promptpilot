'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Dictionary of AI clichés to human-written alternatives
const CLICHE_MAP: Record<string, string[]> = {
  'delve': ['look into', 'explore', 'go deep', 'study'],
  'tapestry': ['variety', 'blend', 'combination', 'mixture', 'range'],
  'furthermore': ['also', 'in addition', 'plus', 'moreover'],
  'moreover': ['additionally', 'also', 'what\'s more'],
  'testament': ['proof', 'sign', 'tribute', 'witness'],
  'foster': ['build', 'encourage', 'promote', 'help grow', 'cultivate'],
  'underscores': ['shows', 'highlights', 'points out', 'stresses'],
  'demystify': ['explain clearly', 'simplify', 'make simple', 'clarify'],
  'in conclusion': ['overall', 'to wrap up', 'lastly', 'in short'],
  'it is crucial to': ['we should', 'it\'s important to', 'make sure to', 'you need to'],
  'it is important to': ['we should', 'it\'s important to', 'remember to', 'you need to'],
  'pivotal': ['key', 'important', 'crucial', 'major'],
  'imperative': ['necessary', 'essential', 'important', 'required'],
  'revolutionize': ['improve', 'change', 'upgrade', 'transform']
};

interface TextSegment {
  id: string;
  text: string;
  type: 'text' | 'cliche' | 'fact';
  originalWord?: string;
  alternatives?: string[];
  description?: string;
}

// Generate Regex for clichés
const clicheKeys = Object.keys(CLICHE_MAP).sort((a, b) => b.length - a.length);
const clicheRegexStr = `\\b(${clicheKeys.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`;
const clicheRegex = new RegExp(clicheRegexStr, 'gi');

// Regex for facts (statistics, percentages, large numbers, dates, URLs)
const factRegex = /(https?:\/\/[^\s\)]+|www\.[^\s\)]+|\b\d+(?:\.\d+)?\s*(?:%|percent|million|billion|trillion|dollars?|€|£)\b|\b\d{4,}\b|\b(19|20)\d{2}\b)/gi;

function matchCasing(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

// Split text into code blocks and normal prose
function splitIntoBlocks(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      return { id: `code-${index}`, isCode: true, text: part };
    }
    return { id: `prose-${index}`, isCode: false, text: part };
  });
}

interface HumanizerEditorProps {
  initialText: string;
  onTextUpdate?: (newText: string) => void;
}

export function HumanizerEditor({ initialText, onTextUpdate }: HumanizerEditorProps) {
  const { toast } = useToast();
  const [text, setText] = useState(initialText);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Sync state if initialText changes from parent
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // Parse a prose block into text segments
  const parseSegments = (proseText: string, blockId: string): TextSegment[] => {
    const matches: { start: number; end: number; type: 'cliche' | 'fact'; val: string }[] = [];
    
    // Find clichés
    let match;
    clicheRegex.lastIndex = 0;
    while ((match = clicheRegex.exec(proseText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'cliche',
        val: match[0]
      });
    }

    // Find facts
    factRegex.lastIndex = 0;
    while ((match = factRegex.exec(proseText)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'fact',
        val: match[0]
      });
    }

    // Sort by start index
    matches.sort((a, b) => a.start - b.start);

    // Deduplicate overlapping matches (e.g. if a cliche contains a number or URL)
    const nonOverlapping: typeof matches = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    // Build segments
    const segments: TextSegment[] = [];
    let currentIndex = 0;

    for (const m of nonOverlapping) {
      if (m.start > currentIndex) {
        segments.push({
          id: `${blockId}-txt-${currentIndex}`,
          text: proseText.slice(currentIndex, m.start),
          type: 'text'
        });
      }

      if (m.type === 'cliche') {
        const lowerVal = m.val.toLowerCase();
        const alternatives = CLICHE_MAP[lowerVal] || ['edit'];
        segments.push({
          id: `${blockId}-cliche-${m.start}`,
          text: m.val,
          type: 'cliche',
          originalWord: m.val,
          alternatives: alternatives,
          description: `"${m.val}" is a common robotic AI word/phrase. Swap it for a natural, human-sounding term.`
        });
      } else {
        segments.push({
          id: `${blockId}-fact-${m.start}`,
          text: m.val,
          type: 'fact',
          description: `Verify Fact: "${m.val}" represents a date, statistic, or link. Ensure the model did not hallucinate this specific detail.`
        });
      }

      currentIndex = m.end;
    }

    if (currentIndex < proseText.length) {
      segments.push({
        id: `${blockId}-txt-${currentIndex}`,
        text: proseText.slice(currentIndex),
        type: 'text'
      });
    }

    return segments;
  };

  // Compile full text into rendering blocks
  const blocks = splitIntoBlocks(text);
  
  // Count total items
  let totalCliches = 0;
  let totalFacts = 0;

  const parsedBlocks = blocks.map(block => {
    if (block.isCode) return { ...block, segments: [] as TextSegment[] };
    const segments = parseSegments(block.text, block.id);
    segments.forEach(seg => {
      if (seg.type === 'cliche') totalCliches++;
      if (seg.type === 'fact') totalFacts++;
    });
    return { ...block, segments };
  });

  // Handle single word replacement
  const replaceWord = (blockId: string, segmentId: string, originalWord: string, replacement: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const block = blocks[blockIndex];
    if (block.isCode) return;

    // We do a replace using regex/index to be absolutely precise
    const segmentIndex = segmentId.split('-').pop(); // Start index is the last part of id
    const startIndex = parseInt(segmentIndex || '0', 10);

    if (isNaN(startIndex)) return;

    const prefix = block.text.slice(0, startIndex);
    const suffix = block.text.slice(startIndex + originalWord.length);
    const capitalizedReplacement = matchCasing(originalWord, replacement);

    // Update block text
    block.text = prefix + capitalizedReplacement + suffix;

    // Reconstruct full text
    const updatedText = blocks.map(b => b.text).join('');
    setText(updatedText);
    setSelectedSegmentId(null);
    if (onTextUpdate) {
      onTextUpdate(updatedText);
    }

    toast({
      title: "Word Humanized",
      description: `Replaced "${originalWord}" with "${capitalizedReplacement}".`
    });
  };

  // Auto-Fix All AI clichés in prose
  const handleAutoFixAll = () => {
    let replacedCount = 0;
    const updatedBlocks = blocks.map(block => {
      if (block.isCode) return block;

      let blockText = block.text;
      // We run the cliche regex loop and replace words from end to start to maintain indices
      const blockMatches: { start: number; text: string; rep: string }[] = [];
      clicheRegex.lastIndex = 0;
      let match;
      while ((match = clicheRegex.exec(blockText)) !== null) {
        const originalWord = match[0];
        const lowerVal = originalWord.toLowerCase();
        const alternatives = CLICHE_MAP[lowerVal];
        if (alternatives && alternatives.length > 0) {
          blockMatches.push({
            start: match.index,
            text: originalWord,
            rep: matchCasing(originalWord, alternatives[0])
          });
        }
      }

      // Replace from back to front
      blockMatches.sort((a, b) => b.start - a.start);
      for (const m of blockMatches) {
        const prefix = blockText.slice(0, m.start);
        const suffix = blockText.slice(m.start + m.text.length);
        blockText = prefix + m.rep + suffix;
        replacedCount++;
      }

      return { ...block, text: blockText };
    });

    if (replacedCount === 0) {
      toast({
        title: "Text Already Humanized",
        description: "No common AI clichés were found in this text."
      });
      return;
    }

    const updatedText = updatedBlocks.map(b => b.text).join('');
    setText(updatedText);
    if (onTextUpdate) {
      onTextUpdate(updatedText);
    }

    toast({
      title: "Fluff Cleaned Successfully",
      description: `Automatically humanized ${replacedCount} terms in your text!`
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Humanizer Toolbar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={`border-amber-500/30 text-amber-400 bg-amber-500/5 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase ${totalCliches > 0 ? 'animate-pulse' : ''}`}>
            {totalCliches} AI Clichés
          </Badge>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest uppercase">
            {totalFacts} Facts to Verify
          </Badge>
        </div>

        <Button 
          onClick={handleAutoFixAll}
          disabled={totalCliches === 0}
          className="bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-xs h-11 px-6 rounded-xl flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
        >
          <Sparkles className="h-4 w-4" />
          Auto-Cut Fluff
        </Button>
      </div>

      {/* Editor Body */}
      <div className="bg-black/60 text-white/95 border border-white/10 rounded-[2.5rem] p-10 font-sans text-[17px] md:text-lg leading-relaxed shadow-2xl relative min-h-[300px] overflow-hidden">
        {/* Glow bars */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        
        <div className="space-y-4 whitespace-pre-wrap select-text">
          {parsedBlocks.map((block) => {
            if (block.isCode) {
              // Code blocks: render statically as code
              return (
                <pre key={block.id} className="p-6 my-4 bg-white/5 rounded-2xl font-mono text-sm border border-white/5 text-amber-200 overflow-x-auto select-all">
                  <code>{block.text.replace(/```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '')}</code>
                </pre>
              );
            }

            // Prose block: render segments inline
            return (
              <p key={block.id} className="inline leading-relaxed">
                {block.segments?.map((segment: TextSegment) => {
                  if (segment.type === 'text') {
                    return <span key={segment.id}>{segment.text}</span>;
                  }

                  if (segment.type === 'cliche') {
                    const isOpen = selectedSegmentId === segment.id;
                    return (
                      <span key={segment.id} className="relative inline-block mx-0.5">
                        <button
                          onClick={() => setSelectedSegmentId(isOpen ? null : segment.id)}
                          className="border-b-2 border-dashed border-amber-500 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 px-1 py-0.5 rounded transition-all font-semibold"
                        >
                          {segment.text}
                        </button>

                        {isOpen && (
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-secondary border border-white/15 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2 duration-200 text-left font-sans">
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-secondary" />

                            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              AI Cliché Flagged
                            </h4>
                            <p className="text-xs text-muted-foreground font-medium mb-4 leading-normal">
                              {segment.description}
                            </p>

                            <div className="space-y-2">
                              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest block">
                                Recommended Replacements
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {segment.alternatives?.map((alt: string) => (
                                  <button
                                    key={alt}
                                    onClick={() => replaceWord(block.id, segment.id, segment.originalWord || '', alt)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-amber-500 hover:text-black text-white rounded-xl text-xs font-bold transition-all border border-white/5 hover:border-transparent"
                                  >
                                    {alt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </span>
                    );
                  }

                  if (segment.type === 'fact') {
                    const isOpen = selectedSegmentId === segment.id;
                    return (
                      <span key={segment.id} className="relative inline-block mx-0.5">
                        <button
                          onClick={() => setSelectedSegmentId(isOpen ? null : segment.id)}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 px-1 py-0.5 rounded border border-blue-500/20 transition-all font-semibold"
                        >
                          {segment.text}
                        </button>

                        {isOpen && (
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 bg-secondary border border-white/15 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-2 duration-200 text-left font-sans">
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-secondary" />

                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
                              Verification Shield
                            </h4>
                            <p className="text-xs text-white/80 font-medium leading-normal mb-3">
                              {segment.description}
                            </p>
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                              Fact-check recommended
                            </span>
                          </div>
                        )}
                      </span>
                    );
                  }

                  return null;
                })}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
