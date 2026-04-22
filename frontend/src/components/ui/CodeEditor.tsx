'use client';

import { useRef, useCallback, useState } from 'react';

// ── Language → file extension map ─────────────────────────────────────────────
const LANG_EXT: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  kotlin: 'kt',
  swift: 'swift',
  sql: 'sql',
  html: 'html',
  css: 'css',
  other: 'txt',
};

// IntelliJ Darcula palette (kept as JS constants so no purge issues)
const D = {
  bg: '#2b2b2b',
  gutter: '#313335',
  gutterText: '#606366',
  tabBar: '#3c3f41',
  text: '#a9b7c6',
  caret: '#bbbbbb',
  placeholder: '#606366',
} as const;

// ── Props ──────────────────────────────────────────────────────────────────────
interface CodeEditorProps {
  value: string;
  language?: string;
  readOnly?: boolean;
  /** Minimum visible rows (default 10) */
  minRows?: number;
  onChange?: (value: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function CodeEditor({
  value,
  language = 'other',
  readOnly = false,
  minRows = 10,
  onChange,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = (value.match(/\n/g)?.length ?? 0) + 1;
  const ext = LANG_EXT[language] ?? 'txt';
  const minH = `${minRows * 1.5}rem`;

  // Sync line-number scroll with textarea scroll
  const syncScroll = useCallback(() => {
    if (lineNumRef.current && taRef.current) {
      lineNumRef.current.scrollTop = taRef.current.scrollTop;
    }
  }, []);

  // Tab → 2 spaces (instead of focus change)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (readOnly || e.key !== 'Tab') return;
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      onChange?.(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    },
    [readOnly, value, onChange],
  );

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="rounded-lg overflow-hidden border border-[#3c3f41] select-none"
      style={{
        fontFamily: "'JetBrains Mono','Fira Code',Consolas,'Courier New',monospace",
        fontSize: 13,
        lineHeight: '1.5rem',
      }}
    >
      {/* ── IDE title bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 h-9 shrink-0"
        style={{ background: D.tabBar }}
      >
        {/* macOS traffic-light dots */}
        <span className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full block" style={{ background: '#ff5f57' }} />
          <span className="w-3 h-3 rounded-full block" style={{ background: '#ffbd2e' }} />
          <span className="w-3 h-3 rounded-full block" style={{ background: '#28c840' }} />
        </span>

        {/* Filename tab */}
        <span
          className="ml-2 text-xs px-3 py-0.5 rounded-t"
          style={{ background: D.bg, color: D.text, opacity: 0.9 }}
        >
          Main.{ext}
        </span>

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1 text-xs transition-opacity"
          style={{ color: copied ? '#6a8759' : D.gutterText, opacity: 0.8 }}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2 8l3.5 3.5L14 4" />
              </svg>
              복사됨
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <rect x="5" y="5" width="8" height="9" rx="1" />
                <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v9a1 1 0 001 1h2" />
              </svg>
              복사
            </>
          )}
        </button>
      </div>

      {/* ── Editor body ────────────────────────────────────────────────────── */}
      <div className="flex overflow-hidden" style={{ background: D.bg, minHeight: minH }}>
        {/* Line numbers (overflow hidden — scrollTop synced via JS) */}
        <div
          ref={lineNumRef}
          className="shrink-0 text-right overflow-hidden"
          style={{
            background: D.gutter,
            color: D.gutterText,
            padding: '0.75rem 0.65rem',
            userSelect: 'none',
            minWidth: '3rem',
          }}
          aria-hidden
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => !readOnly && onChange?.(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="flex-1 resize-none overflow-auto focus:outline-none select-text"
          placeholder={readOnly ? undefined : '코드를 입력하세요...'}
          style={{
            background: 'transparent',
            color: readOnly ? D.text : D.text,
            caretColor: D.caret,
            padding: '0.75rem 1rem',
            minHeight: minH,
            tabSize: 2,
            // Placeholder color via CSS variable trick isn't easy without a global style,
            // so we let browser default — it'll be visible enough on dark bg.
          }}
        />
      </div>
    </div>
  );
}
