'use client';

import { useState, useEffect } from 'react';
import {
  questionAnalysisService,
  type QuestionAnalysis,
  type QuestionRegenerate,
} from '@/services/questionAnalysisService';
import { stripHtml } from '@/lib/html';
import { AlertModal } from './AlertModal';
import { CodeBlock } from './CodeBlock';

interface ApplyPayload {
  content: string;
  code?:   string;
  answer?: string;
}

interface Props {
  content: string;
  onApply?: (payload: ApplyPayload) => void;
  /** CODE 문항 여부 판별 */
  questionType?: string;
  /** CODE 문항일 때 분석 입력에 포함할 코드 원본 */
  code?: string;
  /** 코드 언어 (분석 프롬프트 표기용) */
  language?: string;
  /** 화면 진입 / 문항 전환 시 복원할 기존 분석 결과 */
  initialResult?: QuestionAnalysis;
  /** 분석 성공 시(초기·재분석 모두) 호출 — 부모가 DB 저장 및 state 갱신에 사용 */
  onAnalyzed?: (result: QuestionAnalysis) => void;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  '하': 'text-emerald-700 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-900/50 dark:border-emerald-700',
  '중': 'text-amber-700 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-900/50 dark:border-amber-700',
  '상': 'text-rose-700 bg-rose-100 border-rose-300 dark:text-rose-300 dark:bg-rose-900/50 dark:border-rose-700',
};

const MOCK_REGEN_CODE = `def g(a):
    m = [[x] for x in a]
    b = [row[:] for row in m]
    for i in range(len(b) - 1):
        b[i+1] += b[i]
    return sum(len(x) for x in m)

print(g([1, 2, 3, 4]))`;

const MOCK_RESULT: QuestionAnalysis = {
  keywords:   ['얕은 복사', '리스트 참조', 'in-place 연산', '중첩 리스트', '+=', '슬라이싱'],
  domains:    ['Python', '자료구조', '알고리즘'],
  difficulty: '중',
  summary:    '리스트 얕은 복사(b = m[:])와 += in-place 연산이 원본 리스트에 미치는 영향을 파악하여 실행 결과를 추론하는 문제입니다.',
};

function isUnavailable(err: unknown) {
  return (err as { response?: { data?: { error?: { code?: string } } } })
    ?.response?.data?.error?.code === 'AI_SERVICE_UNAVAILABLE';
}

// ── 태그 직접 입력 컴포넌트 ──────────────────────────────────────────────────────

function TagMultiSelect({
  selected, onToggle, placeholder,
}: {
  tagType: 'KEYWORD' | 'DOMAIN';
  selected: string[];
  onToggle: (name: string) => void;
  placeholder: string;
}) {
  const [inputVal, setInputVal] = useState('');

  const handleAdd = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    if (!selected.includes(trimmed)) onToggle(trimmed);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {selected.map(s => (
            <span key={s} className="flex items-center gap-0.5 pl-2.5 pr-1.5 py-0.5 text-xs rounded-full
              bg-white border border-indigo-200 text-indigo-700 font-medium
              dark:bg-indigo-900/60 dark:border-indigo-600 dark:text-indigo-200">
              {s}
              <button type="button" onClick={() => onToggle(s)}
                className="ml-0.5 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-100 leading-none">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-400 transition
            bg-white border-gray-200 text-gray-700 placeholder-gray-400
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border transition
            border-indigo-300 text-indigo-600 bg-white hover:bg-indigo-50
            dark:border-indigo-600 dark:text-indigo-300 dark:bg-transparent dark:hover:bg-indigo-900/30">
          추가
        </button>
      </div>
    </div>
  );
}

// ── 토글 버튼 공통 스타일 ────────────────────────────────────────────────────────

function ToggleBtn({
  open, onClick, activeClass, icon, label,
}: {
  open: boolean;
  onClick: () => void;
  activeClass: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
        open ? activeClass : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:bg-gray-700/60'
      }`}>
      {icon}
      {open ? '닫기' : label}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
        className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>
  );
}

// ── 메인 패널 ───────────────────────────────────────────────────────────────────

export function QuestionAnalysisPanel({ content, onApply, questionType, code, language, initialResult, onAnalyzed }: Props) {
  const isCode = questionType === 'CODE';

  // 패널 열림 상태
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [rebuildOpen,  setRebuildOpen]  = useState(false);
  const [genOpen,      setGenOpen]      = useState(false);

  // 분석
  const [analyzing,    setAnalyzing]    = useState(false);
  const [result,       setResult]       = useState<QuestionAnalysis | null>(initialResult ?? null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // 화면 진입 / 문항 전환 시 initialResult로 복원
  // 의존성을 [initialResult]로만 한정하여 재분석 결과(setResult)가 되돌려지지 않음
  useEffect(() => {
    setResult(initialResult ?? null);
  }, [initialResult]);

  // 재구성 (재구성 + AI 생성 공유)
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated,  setRegenerated]  = useState<QuestionRegenerate | null>(null);
  const [regenError,   setRegenError]   = useState<string | null>(null);

  // 알림 팝업
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // AI 생성 폼
  const [selKeywords,   setSelKeywords]   = useState<string[]>([]);
  const [selDomains,    setSelDomains]    = useState<string[]>([]);
  const [selDifficulty, setSelDifficulty] = useState<string>('중');

  const hasContent = stripHtml(content).trim().length > 10;

  // ── 핸들러 ──

  const handleAnalyze = async () => {
    if (!hasContent || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setResult(null);
    try {
      const res = await questionAnalysisService.analyze(content, code, language);
      if (res.data.success && res.data.data) {
        setResult(res.data.data);
        onAnalyzed?.(res.data.data);
      } else {
        setAnalyzeError('분석 결과를 받아오지 못했습니다.');
      }
    } catch (err) {
      if (isUnavailable(err)) {
        setResult(MOCK_RESULT);
        onAnalyzed?.(MOCK_RESULT);
      } else {
        setAnalyzeError('AI 분석 중 오류가 발생했습니다.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    if (!result) {
      setAlertMsg('먼저 \'분석 시작\'으로 키워드를 추출한 뒤 재구성할 수 있습니다.');
      return;
    }
    setRegenerating(true);
    setRegenError(null);
    setRegenerated(null);
    try {
      const res = await questionAnalysisService.regenerate({
        keywords: result.keywords, domains: result.domains,
        difficulty: result.difficulty, originalContent: content,
        questionType, originalCode: code, language,
      });
      if (res.data.success && res.data.data) setRegenerated(res.data.data);
      else setRegenError('재구성 결과를 받아오지 못했습니다.');
    } catch (err) {
      if (isUnavailable(err)) {
        setRegenerated(
          isCode
            ? { content: '<p>위 코드의 실행 결과를 쓰시오.</p>', code: MOCK_REGEN_CODE, answer: '10' }
            : { content: '<p>재구성된 문제 내용입니다.</p>' }
        );
      } else {
        setRegenError('문제 재구성 중 오류가 발생했습니다.');
      }
    } finally {
      setRegenerating(false);
    }
  };

  const handleGenerateFromTags = async () => {
    if (regenerating) return;
    if (selKeywords.length === 0 && selDomains.length === 0) {
      setAlertMsg('키워드 또는 도메인을 하나 이상 입력하세요.');
      return;
    }
    setRegenerating(true);
    setRegenError(null);
    setRegenerated(null);
    try {
      const res = await questionAnalysisService.regenerate({
        keywords: selKeywords, domains: selDomains,
        difficulty: selDifficulty, originalContent: '',
        questionType, language,
      });
      if (res.data.success && res.data.data) setRegenerated(res.data.data);
      else setRegenError('재구성 결과를 받아오지 못했습니다.');
    } catch (err) {
      if (isUnavailable(err)) {
        setRegenerated(
          isCode
            ? { content: '<p>위 코드의 실행 결과를 쓰시오.</p>', code: MOCK_REGEN_CODE, answer: '10' }
            : { content: '<p>재구성된 문제 내용입니다.</p>' }
        );
      } else {
        setRegenError('문제 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setRegenerating(false);
    }
  };

  const toggleKeyword = (n: string) => setSelKeywords(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);
  const toggleDomain  = (n: string) => setSelDomains(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  return (
    <div className="mt-2 space-y-2">

      {/* ── 토글 버튼 행 ── */}
      <div className="flex items-center gap-2 flex-wrap">

        <ToggleBtn
          open={analysisOpen}
          onClick={() => setAnalysisOpen(o => !o)}
          activeClass="border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-600 dark:bg-violet-900/50 dark:text-violet-300"
          label="키워드 추출"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          }
        />

        <ToggleBtn
          open={rebuildOpen}
          onClick={() => setRebuildOpen(o => !o)}
          activeClass="border-indigo-400 bg-indigo-100 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
          label="문제 재구성"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          }
        />

        <ToggleBtn
          open={genOpen}
          onClick={() => setGenOpen(o => !o)}
          activeClass="border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
          label="AI 문제 생성"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          }
        />
      </div>

      {/* ── 키워드 추출 패널 (violet) ── */}
      {analysisOpen && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/60 p-4">

          <div className="space-y-3">
          {/* 분석 시작 버튼 */}
          <button type="button" onClick={handleAnalyze} disabled={analyzing || !hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition
              border-violet-400 text-violet-700 bg-white hover:bg-violet-50
              dark:border-violet-600 dark:text-violet-300 dark:bg-transparent dark:hover:bg-violet-900/30
              disabled:opacity-40 disabled:cursor-not-allowed">
            {analyzing
              ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>분석 중...</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>분석 시작</>
            }
          </button>

          {/* 에러 */}
          {analyzeError && <p className="text-xs text-rose-500 dark:text-rose-400">{analyzeError}</p>}

          {/* 결과 */}
          {result && !analyzing && (
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">난이도</p>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${DIFFICULTY_STYLE[result.difficulty] ?? 'text-gray-600 bg-gray-100 border-gray-300'}`}>
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
              <div>
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">핵심 키워드</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map(kw => (
                    <span key={kw} className="px-2.5 py-0.5 rounded-full text-xs font-medium
                      bg-white border border-violet-200 text-violet-700
                      dark:bg-violet-900/60 dark:border-violet-600 dark:text-violet-200">{kw}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-1.5">도메인</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.domains.map(d => (
                    <span key={d} className="px-2.5 py-0.5 rounded-full text-xs font-semibold
                      bg-indigo-50 border border-indigo-200 text-indigo-700
                      dark:bg-indigo-900/60 dark:border-indigo-600 dark:text-indigo-200">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>{/* end flow content */}
        </div>
      )}

      {/* ── 문제 재구성 패널 (indigo) ── */}
      {rebuildOpen && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/60 p-4 space-y-3">

          {/* 현재 분석 결과 미리보기 */}
          {result ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">추출된 키워드 기반으로 재구성합니다</p>
              <div className="flex flex-wrap gap-1">
                {result.keywords.map(kw => (
                  <span key={kw} className="px-2 py-0.5 rounded-full text-xs
                    bg-white border border-indigo-200 text-indigo-600
                    dark:bg-indigo-900/50 dark:border-indigo-700 dark:text-indigo-300">{kw}</span>
                ))}
                {result.domains.map(d => (
                  <span key={d} className="px-2 py-0.5 rounded-full text-xs font-medium
                    bg-indigo-100 border border-indigo-300 text-indigo-700
                    dark:bg-indigo-900/70 dark:border-indigo-600 dark:text-indigo-200">{d}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              키워드 추출을 먼저 실행하면 추출된 키워드를 기반으로 재구성합니다.
            </p>
          )}

          {/* 재구성 시작 */}
          <button type="button" onClick={handleRegenerate} disabled={regenerating || !hasContent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition
              border-indigo-400 text-indigo-700 bg-white hover:bg-indigo-50
              dark:border-indigo-600 dark:text-indigo-300 dark:bg-transparent dark:hover:bg-indigo-900/30
              disabled:opacity-40 disabled:cursor-not-allowed">
            {regenerating
              ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>생성 중...</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>재구성 시작</>
            }
          </button>

          {/* 재구성 결과 */}
          {regenError && <p className="text-xs text-rose-500 dark:text-rose-400">{regenError}</p>}
          {regenerated && !regenerating && (
            <RegenResult
              regen={regenerated}
              original={content}
              originalCode={code}
              language={language}
              isCode={isCode}
              onClose={() => setRegenerated(null)}
              onApply={onApply ? () => {
                onApply({ content: regenerated.content, code: regenerated.code, answer: regenerated.answer });
                setRegenerated(null);
              } : undefined}
            />
          )}
        </div>
      )}

      {/* ── 알림 팝업 ── */}
      <AlertModal
        open={!!alertMsg}
        message={alertMsg ?? ''}
        onClose={() => setAlertMsg(null)}
      />

      {/* ── AI 문제 생성 패널 (blue) ── */}
      {genOpen && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/60 p-4 space-y-3">
          <p className="text-xs text-blue-500 dark:text-blue-400">키워드·도메인을 입력하여 새로운 문제를 생성합니다.</p>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">키워드</p>
              <TagMultiSelect tagType="KEYWORD" selected={selKeywords} onToggle={toggleKeyword} placeholder="키워드 입력 후 Enter..." />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">도메인</p>
              <TagMultiSelect tagType="DOMAIN" selected={selDomains} onToggle={toggleDomain} placeholder="도메인 입력 후 Enter..." />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">난이도</p>
              <div className="flex gap-1.5">
                {(['하', '중', '상'] as const).map(d => (
                  <button key={d} type="button" onClick={() => setSelDifficulty(d)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition ${
                      selDifficulty === d
                        ? DIFFICULTY_STYLE[d]
                        : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700'
                    }`}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          <button type="button" onClick={handleGenerateFromTags}
            disabled={regenerating || (selKeywords.length === 0 && selDomains.length === 0)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition
              border-blue-400 text-blue-700 bg-white hover:bg-blue-50
              dark:border-blue-600 dark:text-blue-300 dark:bg-transparent dark:hover:bg-blue-900/30
              disabled:opacity-40 disabled:cursor-not-allowed">
            {regenerating
              ? <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>생성 중...</>
              : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>생성하기</>
            }
          </button>

          {regenError && <p className="text-xs text-rose-500 dark:text-rose-400">{regenError}</p>}
          {regenerated && !regenerating && (
            <RegenResult
              regen={regenerated}
              original={content}
              originalCode={code}
              language={language}
              isCode={isCode}
              onClose={() => setRegenerated(null)}
              onApply={onApply ? () => {
                onApply({ content: regenerated.content, code: regenerated.code, answer: regenerated.answer });
                setRegenerated(null);
              } : undefined}
            />
          )}
        </div>
      )}

    </div>
  );
}

// ── 재구성 결과 공통 컴포넌트 ────────────────────────────────────────────────────

function RegenResult({
  regen, original, originalCode, language, isCode, onClose, onApply,
}: {
  regen:        QuestionRegenerate;
  original?:    string;
  originalCode?: string;
  language?:    string;
  isCode:       boolean;
  onClose:      () => void;
  onApply?:     () => void;
}) {
  const hasOriginal = !!original && stripHtml(original).trim().length > 0;

  return (
    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {hasOriginal ? '재구성 미리보기' : '재구성된 문제'}
        </p>
        <button type="button" onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition" aria-label="닫기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* 비교 영역 */}
      {isCode ? (
        /* ── CODE 유형: 설명·코드·정답 항목별 좌우 비교 ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {/* 기존 */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">기존 문항</p>
            {/* 설명 */}
            <p className="text-xs leading-relaxed whitespace-pre-wrap p-2.5 rounded-lg border flex-1
              text-gray-500 bg-gray-50 border-gray-200
              dark:text-gray-400 dark:bg-gray-800/40 dark:border-gray-700">
              {hasOriginal ? stripHtml(original!) : '(설명 없음)'}
            </p>
            {/* 코드 */}
            {originalCode ? (
              <CodeBlock code={originalCode} language={language} showHeader={false} size="xs" />
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-600 italic p-2">코드 없음</p>
            )}
          </div>
          {/* 재구성 */}
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-300">재구성된 문항</p>
            {/* 설명 */}
            <p className="text-xs leading-relaxed whitespace-pre-wrap p-2.5 rounded-lg border flex-1
              text-gray-800 bg-white border-indigo-300
              dark:text-gray-100 dark:bg-indigo-950/40 dark:border-indigo-700">
              {stripHtml(regen.content)}
            </p>
            {/* 코드 */}
            {regen.code ? (
              <CodeBlock code={regen.code} language={language} showHeader={false} size="xs" />
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-600 italic p-2">코드 없음</p>
            )}
            {/* 정답 */}
            {regen.answer !== undefined && regen.answer !== null && (
              <div>
                <p className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400 mb-0.5">정답</p>
                <pre className="text-xs font-mono whitespace-pre-wrap p-2.5 rounded-lg border
                  text-gray-800 bg-indigo-50 border-indigo-200
                  dark:text-gray-100 dark:bg-indigo-950/30 dark:border-indigo-700">
                  {regen.answer}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : hasOriginal ? (
        /* ── 비-CODE: 설명 텍스트 좌우 비교 ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">기존 문항</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg border flex-1
              text-gray-500 bg-gray-50 border-gray-200
              dark:text-gray-400 dark:bg-gray-800/40 dark:border-gray-700">
              {stripHtml(original!)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-300">재구성된 문항</p>
            <p className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg border flex-1
              text-gray-800 bg-white border-indigo-300
              dark:text-gray-100 dark:bg-indigo-950/40 dark:border-indigo-700">
              {stripHtml(regen.content)}
            </p>
          </div>
        </div>
      ) : (
        /* ── 비-CODE, 원본 없음: 단일 박스 ── */
        <p className="text-xs leading-relaxed whitespace-pre-wrap p-3 rounded-lg border
          text-gray-800 bg-white border-gray-200
          dark:text-gray-200 dark:bg-gray-800/80 dark:border-gray-700">
          {stripHtml(regen.content)}
        </p>
      )}

      {/* 교체 버튼 — 비교 영역 밖 독립 배치 */}
      {onApply && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <button type="button" onClick={onApply}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition
              border-indigo-500 text-white bg-indigo-500 hover:bg-indigo-600
              dark:border-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            이 문제로 교체
          </button>
        </div>
      )}
    </div>
  );
}
