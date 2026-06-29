'use client';

/**
 * CodeBlock — 구문강조 코드 블록 (Darcula 다크 고정)
 *
 * react-syntax-highlighter Light 빌드를 사용해 번들 최소화.
 * 14개 언어만 등록. 미지정·미매핑 언어는 plain 텍스트 폴백.
 */

import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import darcula from 'react-syntax-highlighter/dist/esm/styles/prism/darcula';

// ── Prism 언어 개별 등록 ────────────────────────────────────────────────────
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('swift', swift);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('css', css);

// ── TPMP language id → Prism id 매핑 ───────────────────────────────────────
const LANG_MAP: Record<string, string> = {
  javascript: 'javascript',
  js:         'javascript',
  typescript: 'typescript',
  ts:         'typescript',
  python:     'python',
  py:         'python',
  java:       'java',
  c:          'c',
  cpp:        'cpp',
  'c++':      'cpp',
  csharp:     'csharp',
  'c#':       'csharp',
  go:         'go',
  golang:     'go',
  rust:       'rust',
  kotlin:     'kotlin',
  swift:      'swift',
  sql:        'sql',
  html:       'markup',
  markup:     'markup',
  xml:        'markup',
  css:        'css',
};

/** TPMP language 문자열을 Prism id로 변환. 미매핑이면 undefined 반환. */
function resolvePrismLang(lang: string | null | undefined): string | undefined {
  if (!lang) return undefined;
  const mapped = LANG_MAP[lang.toLowerCase().trim()];
  return mapped;
}

// ── 커스텀 Darcula 테마 (배경/기본 텍스트 색상만 TPMP 팔레트로 덮어씀) ────
const darculaCustom = {
  ...darcula,
  'pre[class*="language-"]': {
    ...(darcula['pre[class*="language-"]'] as Record<string, unknown>),
    background: '#2b2b2b',
    color:      '#a9b7c6',
    margin:     0,
  },
  'code[class*="language-"]': {
    ...(darcula['code[class*="language-"]'] as Record<string, unknown>),
    background: '#2b2b2b',
    color:      '#a9b7c6',
  },
};

// ── Props ────────────────────────────────────────────────────────────────────
export interface CodeBlockProps {
  code: string;
  language?: string | null;
  /** 'sm'(기본) = text-sm, 'xs' = text-xs */
  size?: 'sm' | 'xs';
  /** 신호등 헤더 표시 여부 (기본 true) */
  showHeader?: boolean;
  className?: string;
}

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────
export function CodeBlock({
  code,
  language,
  size = 'sm',
  showHeader = true,
  className,
}: CodeBlockProps) {
  const prismLang = resolvePrismLang(language);
  const fontSize  = size === 'xs' ? '0.75rem' : '0.875rem';

  return (
    <div className={['rounded-lg overflow-hidden border border-[#3c3f41] text-left', className].filter(Boolean).join(' ')}>
      {showHeader && (
        <div className="bg-[#2b2b2b] px-3 py-1.5 flex items-center gap-1.5 border-b border-[#3c3f41]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          {language && (
            <span className="ml-2 text-[11px] text-[#808080] font-mono">{language}</span>
          )}
        </div>
      )}
      <SyntaxHighlighter
        language={prismLang}
        style={darculaCustom}
        wrapLongLines
        customStyle={{
          background:    '#2b2b2b',
          margin:        0,
          padding:       '1rem',
          lineHeight:    '1.625',
          whiteSpace:    'pre-wrap',
          wordBreak:     'break-word',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize,
            whiteSpace:  'pre-wrap',
            wordBreak:   'break-word',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
