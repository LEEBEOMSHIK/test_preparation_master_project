'use client';

import { RichContent } from '@/components/ui/RichContent';
import { CodeBlock } from '@/components/ui/CodeBlock';
import type { ConceptNote } from '@/types';

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
      {code && <CodeBlock code={code} language={language} className="mt-3" />}
    </div>
  );
}
