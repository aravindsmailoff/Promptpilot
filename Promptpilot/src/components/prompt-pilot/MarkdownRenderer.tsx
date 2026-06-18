import React from 'react';

interface MarkdownRendererProps {
  content: string | null | undefined;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by line breaks
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let isBulletList = false;
  let isNumberedList = false;

  const flushList = (key: string | number) => {
    if (currentList.length > 0) {
      if (isBulletList) {
        renderedElements.push(
          <ul key={`ul-${key}`} className="list-disc ml-6 my-4 space-y-2 text-white/90">
            {currentList}
          </ul>
        );
      } else if (isNumberedList) {
        renderedElements.push(
          <ol key={`ol-${key}`} className="list-decimal ml-6 my-4 space-y-2 text-white/90">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      isBulletList = false;
      isNumberedList = false;
    }
  };

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      const boldIndex = remaining.indexOf('**');
      const codeIndex = remaining.indexOf('`');

      // No more formatting
      if (boldIndex === -1 && codeIndex === -1) {
        parts.push(remaining);
        break;
      }

      // Handle Bold
      if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
        if (boldIndex > 0) {
          parts.push(remaining.substring(0, boldIndex));
        }
        const nextBold = remaining.indexOf('**', boldIndex + 2);
        if (nextBold !== -1) {
          const boldText = remaining.substring(boldIndex + 2, nextBold);
          parts.push(
            <strong key={`bold-${keyIndex++}`} className="font-extrabold text-primary text-glow">
              {boldText}
            </strong>
          );
          remaining = remaining.substring(nextBold + 2);
        } else {
          parts.push(remaining.substring(boldIndex));
          break;
        }
      } 
      // Handle Inline Code
      else {
        if (codeIndex > 0) {
          parts.push(remaining.substring(0, codeIndex));
        }
        const nextCode = remaining.indexOf('`', codeIndex + 1);
        if (nextCode !== -1) {
          const codeText = remaining.substring(codeIndex + 1, nextCode);
          parts.push(
            <code key={`code-${keyIndex++}`} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-sm text-accent border border-white/5">
              {codeText}
            </code>
          );
          remaining = remaining.substring(nextCode + 1);
        } else {
          parts.push(remaining.substring(codeIndex));
          break;
        }
      }
    }

    return parts;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 1. Headings
    if (trimmed.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={index} className="text-lg md:text-xl font-black mt-6 mb-3 text-white tracking-tight uppercase border-l-2 border-primary pl-3">
          {parseInlineMarkdown(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h2 key={index} className="text-xl md:text-2xl font-black mt-8 mb-4 text-white tracking-tight uppercase border-l-4 border-primary pl-4">
          {parseInlineMarkdown(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList(index);
      renderedElements.push(
        <h1 key={index} className="text-2xl md:text-3xl font-black mt-10 mb-6 text-white tracking-tight uppercase border-b border-white/10 pb-2">
          {parseInlineMarkdown(trimmed.slice(2))}
        </h1>
      );
    }
    // 2. Bullet Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!isBulletList) {
        flushList(index);
        isBulletList = true;
      }
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseInlineMarkdown(trimmed.slice(2))}
        </li>
      );
    }
    // 3. Numbered Lists
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!isNumberedList) {
        flushList(index);
        isNumberedList = true;
      }
      const contentStart = trimmed.indexOf('.') + 1;
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseInlineMarkdown(trimmed.substring(contentStart).trim())}
        </li>
      );
    }
    // 4. Empty Lines
    else if (trimmed === '') {
      flushList(index);
      renderedElements.push(<div key={index} className="h-4" />);
    }
    // 5. Plain paragraphs
    else {
      flushList(index);
      renderedElements.push(
        <p key={index} className="my-3 text-white/80 leading-relaxed font-medium">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  });

  // Flush any final list items
  flushList('final');

  return <div className="space-y-1">{renderedElements}</div>;
}
