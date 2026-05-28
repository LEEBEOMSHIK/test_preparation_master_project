'use client';

import { useState } from 'react';
import {
  questionAnalysisService,
  type QuestionAnalysis,
} from '@/services/questionAnalysisService';
import { stripHtml } from '@/lib/html';

interface Props {
  content: string;
  onApplyContent?: (html: string) => void;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  '하': 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/50 dark:border-emerald-700',
  '중': 'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-900/50 dark:border-amber-700',
  '상': 'text-rose-700 bg-rose-100 border-rose-300 dark:text-rose-300 dark:bg-rose-900/50 dark:border-rose-700',
};

const MOCK_RESULT: QuestionAnalysis = {
  keywords:   ['얕은 복사', '리스트 참조', 'in-place 연산', '중첩 리스트', '+=', '슬라이싱'],
  domains:    ['Python', '자료구조', '알고리즘'],
  difficulty: '상',
  summary:    '리스트 얕은 복사(b = m[:])와 += in-place 연산이 원본 리스트에 미치는 영향을 파악하여 실행 결과를 추론하는 문제입니다.',
};

function isUnavailable(err: unknown) {
  return (err as { response?: { data?: { error?: { code?: string } } } })
    ?.response?.data?.error?.code === 'AI_SERVICE_UNAVAILABLE';
}

export function QuestionAnalysisPanel({ content, onApplyContent }: Props) {
  const [analyzing,    setAnalyzing]    = useState(false);
  const [result,       setResult]       = useState<QuestionAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated,  setRegenerated]  = useState<string | null>(null);
  const [regenError,   setRegenError]   = useState<string | null>(null);

  const hasContent = stripHtml(content).trim().length > 10;

  const handleAnalyze = async () => {
    if (!hasContent || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setResult(null);
    setRegenerated(null);
    try {
      const res = await questionAnalysisService.analyze(content);
      if (res.data.success && res.data.data) setResult(res.data.data);
      else setAnalyzeError('분석 결과를 받아오지 못했습니다.');
    } catch (err) {
      setAnalyzeError(isUnavailable(err) ? '__unavailable__' : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!result || regenerating) return;
    setRegenerating(true);
    setRegenError(null);
    setRegenerated(null);
    try {
      const res = await questionAnalysisService.regenerate({
        keywords:        result.keywords,
        domains:         result.domains,
        difficulty:      result.difficulty,
        originalContent: content,
      });
      if (res.data.success && res.data.data) setRegenerated(res.data.data.content);
      else setRegenError('재구성 결과를 받아오지 못했습니다.');
    } catch (err) {
      setRegenError(isUnavailable(err) ? '__unavailable__' : '문제 재구성 중 오류가 발생했습니다.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleApply = () => {
    if (regenerated && onApplyContent) {
      onApplyContent(regenerated);
      setRegenerated(null);
    }
  };

  return (
    <div className="mt-2 space-y-3">

      {/* ── 버튼 행 ── */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* 키워드 추출 */}
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing || !hasContent}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border
            border-violet-300 text-violet-700 bg-violet-50
            hover:bg-violet-100
            dark:border-violet-600 dark:text-violet-300 dark:bg-violet-900/40 dark:hover:bg-violet-900/70
            disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {analyzing ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              AI 분석 중...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              키워드 추출
            </>
          )}
        </button>

        {/* UI 미리보기 토글 */}
        <button
          type="button"
          onClick={() => {
            if (result === MOCK_RESULT) {
              setResult(null);
            } else {
              setResult(MOCK_RESULT);
              setAnalyzeError(null);
              setRegenerated(null);
            }
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition ${
            result === MOCK_RESULT
              ? 'border-gray-400 bg-gray-200 text-gray-800 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {result === MOCK_RESULT ? '미리보기 닫기' : 'UI 미리보기'}
        </button>
      </div>

      {/* ── 분석 에러 ── */}
      {analyzeError === '__unavailable__' ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI 분석 기능이 아직 준비 중입니다.
        </p>
      ) : analyzeError ? (
        <p className="text-xs text-rose-500 dark:text-rose-400">{analyzeError}</p>
      ) : null}

      {/* ── 분석 결과 패널 ── */}
      {result && !analyzing && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/60 p-4 space-y-3">

          {/* 핵심 키워드 */}
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">핵심 키워드</p>
            <div className="flex flex-wrap gap-1.5">
              {result.keywords.map((kw) => (
                <span key={kw} className="px-2.5 py-0.5 rounded-full text-xs font-medium
                  bg-white border border-violet-200 text-violet-700
                  dark:bg-violet-900/60 dark:border-violet-600 dark:text-violet-200">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* 도메인 */}
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">도메인</p>
            <div className="flex flex-wrap gap-1.5">
              {result.domains.map((d) => (
                <span key={d} className="px-2.5 py-0.5 rounded-full text-xs font-semibold
                  bg-indigo-50 border border-indigo-200 text-indigo-700
                  dark:bg-indigo-900/60 dark:border-indigo-600 dark:text-indigo-200">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* 난이도 + 요약 */}
          <div className="flex items-start gap-4 pt-0.5">
            <div className="shrink-0">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">난이도</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${DIFFICULTY_STYLE[result.difficulty] ?? 'text-gray-600 bg-gray-100 border-gray-300 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600'}`}>
                {result.difficulty}
              </span>
            </div>
            {result.summary && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">요약</p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{result.summary}</p>
              </div>
            )}
          </div>

          {/* 문제 재구성 버튼 + 결과 */}
          <div className="pt-1 border-t border-violet-200 dark:border-violet-700 space-y-3">
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition
                border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100
                dark:border-indigo-600 dark:text-indigo-300 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/70
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {regenerating ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  문제 생성 중...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  문제 재구성
                </>
              )}
            </button>

            {/* 재구성 에러 */}
            {regenError === '__unavailable__' ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI 기능이 아직 준비 중입니다.
              </p>
            ) : regenError ? (
              <p className="text-xs text-rose-500 dark:text-rose-400">{regenError}</p>
            ) : null}

            {/* 재구성 결과 */}
            {regenerated && !regenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">재구성된 문제</p>
                  <button
                    type="button"
                    onClick={() => setRegenerated(null)}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
                    aria-label="닫기"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg border
                  text-gray-800 bg-white border-indigo-100
                  dark:text-gray-200 dark:bg-gray-800/80 dark:border-indigo-800">
                  {stripHtml(regenerated)}
                </p>
                {onApplyContent && (
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition
                      border-indigo-500 text-white bg-indigo-500 hover:bg-indigo-600
                      dark:border-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    이 문제로 교체
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
