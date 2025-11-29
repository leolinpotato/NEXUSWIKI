/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useMemo } from 'react';

interface ContentDisplayProps {
  content: string;
  isLoading: boolean;
  onWordClick: (word: string) => void;
  language: string;
}

/**
 * Helper to map display language to BCP 47 locale for Intl.Segmenter
 */
const getLocale = (lang: string): string => {
  const map: Record<string, string> = {
    'Traditional Chinese': 'zh-Hant',
    'Simplified Chinese': 'zh-Hans',
    'Japanese': 'ja',
    'English': 'en',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Hindi': 'hi',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Italian': 'it'
  };
  return map[lang] || 'en';
};

/**
 * Renders a segment of text as interactive words.
 */
const InteractiveSegment: React.FC<{
  text: string;
  onWordClick: (word: string) => void;
  language: string;
}> = ({ text, onWordClick, language }) => {
  const segments = useMemo(() => {
    const locale = getLocale(language);
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter(locale, { granularity: 'word' });
      return Array.from(segmenter.segment(text));
    }
    return text.split(/(\s+)/).map((s, i) => ({ segment: s, isWordLike: /\S/.test(s), index: i }));
  }, [text, language]);

  return (
    <span>
      {segments.map((seg: any, index: number) => {
        const word = seg.segment;
        const clickable = typeof seg.isWordLike === 'boolean' ? seg.isWordLike : /\S/.test(word);

        if (clickable) {
          const cleanWord = word.replace(/[.,!?;:()"']/g, '').trim();
          if (cleanWord) {
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent container click
                  onWordClick(cleanWord);
                }}
                className="interactive-word"
                aria-label={`Learn more about ${cleanWord}`}
              >
                {word}
              </button>
            );
          }
        }
        return <span key={index}>{word}</span>;
      })}
    </span>
  );
};

/**
 * Wrapper that first splits by bold markers (**text**) then delegates to InteractiveSegment.
 */
const InteractiveTextBlock: React.FC<{
  text: string;
  onWordClick: (word: string) => void;
  language: string;
}> = ({ text, onWordClick, language }) => {
  // Regex to match **text** pattern
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const content = part.slice(2, -2);
          return (
            <button
              key={index}
              className="interactive-word bold-term"
              onClick={(e) => {
                e.stopPropagation();
                onWordClick(content);
              }}
            >
              {content}
            </button>
          );
        }
        return <InteractiveSegment key={index} text={part} onWordClick={onWordClick} language={language} />;
      })}
    </span>
  );
};

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, isLoading, onWordClick, language }) => {
  
  const descriptionMarker = '## Description';
  const relevantMarker = '## Related Topic'; // Changed to match prompt update

  let descriptionText = '';
  let relevantText = '';

  if (content.includes(relevantMarker)) {
    const parts = content.split(relevantMarker);
    descriptionText = parts[0].replace(descriptionMarker, '').trim();
    relevantText = parts[1].trim();
  } else if (content.includes(descriptionMarker)) {
     descriptionText = content.replace(descriptionMarker, '').trim();
  } else {
    descriptionText = content;
  }

  // Handler for searching selected text when clicked
  const handleMouseDown = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Check if click is inside the selection range
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    let clickedInside = false;
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        clickedInside = true;
        break;
      }
    }

    if (clickedInside) {
      e.preventDefault(); // Prevent text deselection
      const text = selection.toString().trim();
      if (text) {
        onWordClick(text);
        selection.removeAllRanges(); // Clear selection after search
      }
    }
  };

  return (
    <div className="content-display" onMouseDown={handleMouseDown}>
      <section style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ 
          fontSize: '0.85em', 
          textTransform: 'uppercase', 
          letterSpacing: '0.1em', 
          color: '#888',
          marginBottom: '1rem',
          borderBottom: '1px solid #eee',
          paddingBottom: '0.5rem'
        }}>
          Description
        </h3>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          <InteractiveTextBlock text={descriptionText} onWordClick={onWordClick} language={language} />
          {isLoading && !relevantText && <span className="blinking-cursor">|</span>}
        </p>
      </section>

      {(relevantText || (isLoading && content.includes(relevantMarker))) && (
        <section>
          <h3 style={{ 
            fontSize: '0.85em', 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            color: '#888',
            marginBottom: '1rem',
            borderBottom: '1px solid #eee',
            paddingBottom: '0.5rem'
          }}>
            Related Topic
          </h3>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
             <InteractiveTextBlock text={relevantText} onWordClick={onWordClick} language={language} />
             {isLoading && <span className="blinking-cursor">|</span>}
          </p>
        </section>
      )}
    </div>
  );
};

export default ContentDisplay;