'use client';

import { RichContent } from '@/components/ui/RichContent';
import type { ConceptNote } from '@/types';

function CodeBlock({ code, language }: { code: string; language?: string | null }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[#3c3f41] text-left mt-3">
      <div className="bg-[#2b2b2b] px-3 py-1.5 flex items-center gap-1.5 border-b border-[#3c3f41]">
        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
        {language && (
          <span className="ml-2 text-[11px] text-[#808080] font-mono">{language}</span>
        )}
      </div>
      <pre className="bg-[#2b2b2b] text-[#a9b7c6] text-sm p-4 overflow-x-auto font-mono leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface Props {
  note: ConceptNote;
}

export function LinkedQuestionBox({ note }: Props) {
  const content = note.questionContent || note.questionBankContent;
  const code = note.questionCode || note.questionBankCode;
  const language = note.questionLanguage || note.questionBankLanguage;
  const source = note.questionId ? '시험문제' : note.questionBankId ? '퀴즈문제' : null;
  if (!content || !source) return null;

  return (
    <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-indigo-500 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
          {source}
        </span>
        <span className="text-xs text-indigo-400">이 문제에서 작성된 개념노트</span>
      </div>
      <RichContent html={content} className="text-sm text-gray-700" />
      {code && <CodeBlock code={code} language={language} />}
    </div>
  );
}
