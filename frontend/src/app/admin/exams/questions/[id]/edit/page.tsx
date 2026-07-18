'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { examService } from '@/services/examService';
import { domainService } from '@/services/domainService';
import { questionAnalysisService, type QuestionAnalysis } from '@/services/questionAnalysisService';
import type { QuestionType, DomainMaster, DomainSlave } from '@/types';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { QuestionAnalysisPanel } from '@/components/ui/QuestionAnalysisPanel';
import { SchedulingProblemEditor } from '@/components/ui/SchedulingProblemEditor';
import { emptySchedulingDraft, fromSchedulingData, toSchedulingDataPayload, type SchedulingDataDraft } from '@/lib/scheduling';
import { SqlProblemEditor } from '@/components/ui/SqlProblemEditor';
import { emptySqlDraft, fromSqlData, isExpectedResultEnabled, serializeSqlResult, toSqlDataPayload, type SqlDataDraft } from '@/lib/sql';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { stripHtml } from '@/lib/html';
import { hasOptions, parseAnswerToSlots, slotsToAnswer } from '@/lib/answer';
import { isBlankOrPositiveIntegerText, toOptionalPositiveInteger } from '@/lib/questionNumber';

// ── Constants ──────────────────────────────────────────────────────────────────

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: '객관식',   desc: '보기 중 정답 선택' },
  { value: 'SHORT_ANSWER',    label: '주관식',   desc: '직접 답 작성' },
  { value: 'OX',              label: 'O/X',     desc: '참/거짓 판별' },
  { value: 'CODE',            label: '코드',    desc: '프로그래밍 문제' },
  { value: 'SCHEDULING',      label: '스케줄링', desc: 'CPU 스케줄링 문제' },
  { value: 'SQL',             label: 'SQL',     desc: '테이블·데이터 기반 SQL 문제' },
];

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python',     label: 'Python' },
  { value: 'java',       label: 'Java' },
  { value: 'c',          label: 'C' },
  { value: 'cpp',        label: 'C++' },
  { value: 'csharp',     label: 'C#' },
  { value: 'go',         label: 'Go' },
  { value: 'rust',       label: 'Rust' },
  { value: 'kotlin',     label: 'Kotlin' },
  { value: 'swift',      label: 'Swift' },
  { value: 'sql',        label: 'SQL' },
  { value: 'html',       label: 'HTML' },
  { value: 'css',        label: 'CSS' },
  { value: 'other',      label: '기타' },
];

// ── Form State ─────────────────────────────────────────────────────────────────

interface FormState {
  title:        string;
  examYear:     string;
  examRound:    string;
  questionNo:   string;
  /** 발문(지시문) — 문항 내용과 분리 저장, 모든 유형 공용(선택) */
  instruction:  string;
  content:      string;
  questionType: QuestionType;
  options:      string[];
  answer:       string;
  code:         string;
  language:     string;
  explanation:  string;
  categoryId:   number | null;
  examTypeId:   number | null;
  /** AI 분석 결과 (미분석 시 null) */
  aiAnalysis:   QuestionAnalysis | null;
  /** CPU 스케줄링 구조화 데이터 (SCHEDULING 유형에서만 사용) */
  schedulingData: SchedulingDataDraft;
  /** SQL 구조화 데이터 (SQL 유형에서만 사용) */
  sqlData: SqlDataDraft;
  /** true면 정답 문자열의 `||`를 대체 정답 구분자로 해석하지 않음(코드 조건의 논리 OR 보호용) */
  disableAlternativeAnswer: boolean;
}

const defaultForm = (): FormState => ({
  title:        '',
  examYear:     '',
  examRound:    '',
  questionNo:   '',
  instruction:  '',
  content:      '',
  questionType: 'MULTIPLE_CHOICE',
  options:      ['', '', '', ''],
  answer:       '1',
  code:         '',
  language:     'javascript',
  explanation:  '',
  categoryId:   null,
  examTypeId:   null,
  aiAnalysis:   null,
  schedulingData: emptySchedulingDraft(),
  sqlData:      emptySqlDraft(),
  disableAlternativeAnswer: false,
});

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminQuestionEditPage() {
  const router   = useRouter();
  const params   = useParams();
  const id       = Number(params.id);

  const [form,    setForm]    = useState<FormState>(defaultForm());
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [domains, setDomains] = useState<DomainMaster[]>([]);

  // ── 정답 슬롯(빈칸 순서대로) — options가 있을 때만 사용. 0 = 아직 미선택.
  // 문항 로드 시 1회 answer 문자열을 파싱해 초기화한다. 매칭 실패 시(레거시·손상 데이터)
  // 슬롯 UI 대신 원문 텍스트 입력으로 폴백하고, 이후로는 이 로컬 상태가 진실 원천이다.
  const [slots, setSlots] = useState<number[]>([]);
  const [answerFallback, setAnswerFallback] = useState(false);

  const commitSlots = (next: number[]) => {
    setSlots(next);
    update('answer', slotsToAnswer(next));
  };
  const addSlot = () => commitSlots([...slots, 0]);
  const removeSlot = (slotIdx: number) => commitSlots(slots.filter((_, idx) => idx !== slotIdx));
  const selectSlot = (slotIdx: number, optionNo: number) =>
    commitSlots(slots.map((v, idx) => (idx === slotIdx ? optionNo : v)));

  const examTypeSlaves: DomainSlave[]     = domains.find((m) => m.code === 'EXAM_TYPE')?.slaves ?? [];
  const questionTypeSlaves: DomainSlave[] = domains.find((m) => m.code === 'QUESTION_TYPE')?.slaves ?? [];
  const examYearSlaves: DomainSlave[]     = domains.find((m) => m.code === 'EXAM_YEAR')?.slaves ?? [];
  const examRoundSlaves: DomainSlave[]    = domains.find((m) => m.code === 'EXAM_ROUND')?.slaves ?? [];

  useEffect(() => {
    domainService.getDomains()
      .then((res) => setDomains(res.data.data ?? []))
      .catch(() => {});
  }, []);

  // 기존 문항 로드
  useEffect(() => {
    examService.adminGetQuestion(id)
      .then((res) => {
        const q = res.data.data;
        if (!q) return;
        const loadedOptions = q.options?.length ? q.options : [];
        const loadedAnswer  = q.answer ?? (q.questionType === 'OX' ? 'O' : q.questionType === 'MULTIPLE_CHOICE' ? '1' : '');
        setForm({
          title:        q.title ?? '',
          examYear:     q.examYear != null ? String(q.examYear) : '',
          examRound:    q.examRound != null ? String(q.examRound) : '',
          questionNo:   q.questionNo != null ? String(q.questionNo) : '',
          instruction:  q.instruction ?? '',
          content:      q.content,
          questionType: q.questionType,
          options:      loadedOptions,
          answer:       loadedAnswer,
          code:         q.code ?? '',
          language:     q.language ?? 'javascript',
          explanation:  q.explanation ?? '',
          categoryId:   q.categoryId ?? null,
          examTypeId:   q.examTypeId ?? null,
          aiAnalysis:   q.aiKeywords && q.aiDomains
            ? {
                keywords:   q.aiKeywords,
                domains:    q.aiDomains,
                difficulty: (q.aiDifficulty as QuestionAnalysis['difficulty']) ?? '중',
                summary:    q.aiSummary ?? '',
              }
            : null,
          schedulingData: fromSchedulingData(q.schedulingData),
          sqlData:      fromSqlData(q.sqlData),
          disableAlternativeAnswer: q.disableAlternativeAnswer ?? false,
        });
        // 보기가 있으면 기존 answer를 슬롯으로 복원 시도 — 매칭 실패 시 원문 텍스트 폴백
        if (hasOptions(loadedOptions)) {
          const parsed = parseAnswerToSlots(loadedAnswer, loadedOptions);
          if (parsed === null) {
            setAnswerFallback(true);
            setSlots([]);
          } else {
            setAnswerFallback(false);
            setSlots(parsed);
          }
        } else {
          setAnswerFallback(false);
          setSlots([]);
        }
      })
      .catch(() => setError('문항 정보를 불러오지 못했습니다.'))
      .finally(() => setFetching(false));
  }, [id]);

  const update = (field: keyof FormState, value: string | string[] | number | boolean | null | QuestionAnalysis | SchedulingDataDraft | SqlDataDraft) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /** AI 분석 완료 콜백 — state 갱신 + DB 즉시 저장(silent 실패) */
  const handleAnalyzed = (result: QuestionAnalysis) => {
    update('aiAnalysis', result);
    questionAnalysisService.saveAnalysis(id, result).catch(() => {});
  };

  const handleTypeChange = (type: QuestionType) => {
    const optionsActive = hasOptions(form.options);
    setForm((prev) => ({
      ...prev,
      questionType: type,
      answer:   optionsActive ? '' : (type === 'OX' ? 'O' : type === 'MULTIPLE_CHOICE' ? '1' : ''),
      language: type === 'CODE' ? (prev.language || 'javascript') : prev.language,
    }));
    if (optionsActive) {
      setAnswerFallback(false);
      setSlots([]);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim())  { setError('문항 제목을 입력하세요.'); return; }
    if (!form.examTypeId)    { setError('시험 유형을 선택하세요.'); return; }
    if (!form.categoryId)    { setError('문항 유형을 선택하세요.'); return; }
    if (!isBlankOrPositiveIntegerText(form.questionNo)) {
      setError('문항번호는 1 이상이어야 합니다.');
      return;
    }
    if (!stripHtml(form.content) && !form.instruction.trim()) {
      setError('발문 또는 문항 내용 중 하나는 입력하세요.');
      return;
    }
    if (form.questionType === 'CODE' && !form.code.trim()) { setError('코드를 입력하세요.'); return; }
    const filledOptionCount = form.options.filter((o) => o.trim() !== '').length;
    if (form.questionType === 'MULTIPLE_CHOICE' && filledOptionCount < 2) {
      setError('객관식은 보기를 2개 이상 입력하세요.');
      return;
    }
    if (hasOptions(form.options) && filledOptionCount < 2) {
      setError('보기를 사용하려면 2개 이상 입력하세요.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const sqlDataPayload = isSql ? toSqlDataPayload(form.sqlData) : undefined;
      await examService.adminUpdateQuestion(id, {
        title:        form.title.trim() || undefined,
        examYear:     form.examYear ? Number(form.examYear) : undefined,
        examRound:    form.examRound ? Number(form.examRound) : undefined,
        questionNo:   toOptionalPositiveInteger(form.questionNo),
        instruction:  form.instruction.trim() || undefined,
        content:      form.content.trim(),
        questionType: form.questionType,
        categoryId:   form.categoryId ?? undefined,
        examTypeId:   form.examTypeId ?? undefined,
        options:      form.options.length ? form.options.filter(Boolean) : undefined,
        // 결과 테이블 정답이 있으면 텍스트 정답 대신 직렬화된 문자열을 자동 세팅
        answer:       sqlDataPayload?.expectedResult
          ? serializeSqlResult(sqlDataPayload.expectedResult)
          : (form.answer || undefined),
        code:         form.code   || undefined,
        language:     form.language || undefined,
        explanation:  form.explanation || undefined,
        schedulingData: isScheduling ? toSchedulingDataPayload(form.schedulingData) : undefined,
        sqlData:      sqlDataPayload,
        disableAlternativeAnswer: form.disableAlternativeAnswer,
        aiKeywords:   form.aiAnalysis?.keywords,
        aiDomains:    form.aiAnalysis?.domains,
        aiDifficulty: form.aiAnalysis?.difficulty,
        aiSummary:    form.aiAnalysis?.summary,
      });
      router.push('/admin/exams/questions');
    } catch {
      setError('문항 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const isCode = form.questionType === 'CODE';
  const isScheduling = form.questionType === 'SCHEDULING';
  const isSql = form.questionType === 'SQL';

  const editExamTypeName   = examTypeSlaves.find((s) => s.id === form.examTypeId)?.name ?? '';
  const editCategoryName   = questionTypeSlaves.find((s) => s.id === form.categoryId)?.name ?? '';
  const titleSuggestion    = [
    form.examYear  ? `${form.examYear}년`    : '',
    form.examRound ? `제${form.examRound}회` : '',
    form.questionNo ? `${form.questionNo}번` : '',
    editExamTypeName,
    editCategoryName,
  ].filter(Boolean).join(' / ');

  if (fetching) {
    return (
      <div className="max-w-3xl">
        <TableSkeleton rows={5} cols={2} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/admin/exams/questions"
          className="text-gray-400 hover:text-gray-600 transition" aria-label="뒤로가기">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">문항 수정</h2>
          <p className="text-sm text-gray-500">문항 내용을 수정하고 저장하세요.</p>
        </div>
      </div>

      {/* 폼 카드 */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="p-5 space-y-5">

          {/* 문항 제목 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              문항 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              maxLength={200}
              placeholder="관리용 제목 (예: 2024년 1회 1번)"
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            {titleSuggestion && (
              <div className="mt-1.5 flex items-center gap-2 min-w-0">
                <span className="text-xs text-gray-400 truncate">예: {titleSuggestion}</span>
                <button
                  type="button"
                  onClick={() => update('title', titleSuggestion)}
                  className="shrink-0 text-xs text-indigo-500 hover:text-indigo-700 transition"
                >
                  자동완성
                </button>
              </div>
            )}
          </div>

          {/* 시험 연도 / 회차 / 문항번호 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                시험 연도 <span className="text-gray-300 font-normal">(선택)</span>
              </label>
              <select
                value={form.examYear}
                onChange={(e) => update('examYear', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="">연도 선택</option>
                {examYearSlaves.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}년</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                시험 회차 <span className="text-gray-300 font-normal">(선택)</span>
              </label>
              <select
                value={form.examRound}
                onChange={(e) => update('examRound', e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              >
                <option value="">회차 선택</option>
                {examRoundSlaves.map((s) => (
                  <option key={s.id} value={s.name}>제{s.name}회</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                문항번호 <span className="text-gray-300 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[1-9][0-9]*"
                step={1}
                value={form.questionNo}
                onChange={(e) => {
                  if (isBlankOrPositiveIntegerText(e.target.value)) {
                    update('questionNo', e.target.value);
                  }
                }}
                placeholder="자동"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* 유형 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">유형</label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleTypeChange(t.value)}
                  title={t.desc}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                    form.questionType === t.value
                      ? t.value === 'CODE'
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : t.value === 'SCHEDULING'
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : t.value === 'SQL'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300',
                  ].join(' ')}
                >
                  {t.value === 'CODE' && <span className="mr-1 font-mono">{'{}'}</span>}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 시험 유형 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              시험 유형 <span className="text-red-400">*</span>
            </label>
            <select
              value={form.examTypeId ?? ''}
              onChange={(e) => update('examTypeId', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">시험 유형을 선택하세요</option>
              {examTypeSlaves.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 문항 유형 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              문항 유형 <span className="text-red-400">*</span>
            </label>
            <select
              value={form.categoryId ?? ''}
              onChange={(e) => update('categoryId', e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">문항 유형을 선택하세요</option>
              {questionTypeSlaves.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 발문(지시문) — 모든 유형 공용, 선택 입력 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              발문 (지시문) <span className="text-gray-300 font-normal">(선택)</span>
            </label>
            <textarea
              rows={2}
              value={form.instruction}
              onChange={(e) => update('instruction', e.target.value)}
              maxLength={1000}
              placeholder="예: 다음 설명을 보고 알맞은 용어를 작성하시오. (선택)"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
            />
          </div>

          {/* 문항 내용 — 발문·내용 중 하나만 있으면 되므로 선택 입력 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {isCode ? '문제 설명' : '문항 내용'}{' '}
              <span className="text-gray-300 font-normal">(선택 — 발문과 내용 중 하나는 필수)</span>
            </label>
            <RichTextEditor
              value={form.content}
              onChange={(html) => update('content', html)}
              placeholder={isCode ? '예: 아래 코드의 실행 결과를 작성하시오.' : '문항 내용을 입력하세요.'}
              minHeight={isCode ? 100 : 150}
            />
            {!isCode && (
              <QuestionAnalysisPanel
                content={form.content}
                questionType={form.questionType}
                onApply={(p) => update('content', p.content)}
                initialResult={form.aiAnalysis ?? undefined}
                onAnalyzed={handleAnalyzed}
              />
            )}
          </div>

          {/* ── CODE ── */}
          {isCode && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">프로그래밍 언어</label>
                <select
                  value={form.language}
                  onChange={(e) => update('language', e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  코드 <span className="text-red-400">*</span>
                </label>
                <CodeEditor
                  value={form.code}
                  language={form.language}
                  onChange={(v) => update('code', v)}
                  minRows={10}
                />
              </div>
              {/* 정답 / 예상 출력 — 보기가 있으면 번호 선택 UI로 대체되므로 숨김 */}
              {!hasOptions(form.options) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">정답 / 예상 출력</label>
                  <textarea
                    rows={3}
                    value={form.answer}
                    onChange={(e) => update('answer', e.target.value)}
                    placeholder="예상 출력값 또는 정답을 입력하세요."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 transition resize-none bg-gray-50"
                  />
                </div>
              )}
            </div>
          )}

          {isCode && (
            <QuestionAnalysisPanel
              content={form.content}
              questionType={form.questionType}
              code={form.code}
              language={form.language}
              onApply={(p) => {
                update('content', p.content);
                if (p.code !== undefined) update('code', p.code);
                if (p.answer !== undefined) update('answer', p.answer);
              }}
              initialResult={form.aiAnalysis ?? undefined}
              onAnalyzed={handleAnalyzed}
            />
          )}

          {/* ── SCHEDULING ── */}
          {isScheduling && (
            <div className="space-y-3">
              <SchedulingProblemEditor
                value={form.schedulingData}
                onChange={(next) => update('schedulingData', next)}
              />
              {/* 정답 (선택) — 보기가 있으면 번호 선택 UI로 대체되므로 숨김 */}
              {!hasOptions(form.options) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">정답 (선택)</label>
                  <input
                    type="text"
                    value={form.answer}
                    onChange={(e) => update('answer', e.target.value)}
                    maxLength={2000}
                    placeholder="예: P1,P3 또는 평균 대기시간 값 등 모범 답안을 입력하세요."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
                  />
                </div>
              )}
            </div>
          )}

          {/* ── SQL ── */}
          {isSql && (
            <div className="space-y-3">
              <SqlProblemEditor
                value={form.sqlData}
                onChange={(next) => update('sqlData', next)}
              />
              {/* 정답 (선택) — 보기가 있거나 결과 테이블 정답이 활성화되어 있으면 숨김 */}
              {!hasOptions(form.options) && !isExpectedResultEnabled(form.sqlData.expectedResult) && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">정답 (선택)</label>
                  <input
                    type="text"
                    value={form.answer}
                    onChange={(e) => update('answer', e.target.value)}
                    maxLength={2000}
                    placeholder="예: SELECT name FROM employees WHERE ... 등 모범 답안을 입력하세요."
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                  />
                </div>
              )}
              {!hasOptions(form.options) && isExpectedResultEnabled(form.sqlData.expectedResult) && (
                <p className="text-xs text-cyan-600 bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-2">
                  결과 테이블 정답으로 채점됩니다.
                </p>
              )}
            </div>
          )}

          {/* 대체 정답(||) 구분자 사용 안 함 — 코드 조건 정답의 논리 OR(||)가 대체 정답 구분자로
               오인되는 것을 방지 (예: "a < m || b[a] < x") */}
          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.disableAlternativeAnswer}
              onChange={(e) => update('disableAlternativeAnswer', e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-600">
              대체 정답(<code className="font-mono">||</code>) 구분자 사용 안 함
              <span className="block text-gray-400">
                정답에 코드 조건의 논리 OR(<code className="font-mono">||</code>)가 포함된 경우 체크하세요.
                체크하면 정답 전체를 하나의 답으로만 채점·표시합니다.
              </span>
            </span>
          </label>

          {/* ── 보기 (선택) — 유형 무관 상시 노출. 입력하면 유형과 무관하게
               '보기 참고 후 번호 입력' 문제로 동작한다. ── */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500">
              보기 (선택 — 입력하면 유형과 무관하게 &apos;보기 참고 후 번호 입력&apos; 문제로 동작합니다)
            </label>
            {form.options.length === 0 ? (
              <button
                type="button"
                onClick={() => update('options', ['', ''])}
                className="text-xs text-indigo-500 hover:text-indigo-700 transition"
              >
                + 보기 추가
              </button>
            ) : (
              <>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      title="보기 번호"
                      className="w-6 h-6 rounded-full text-xs font-bold shrink-0 border bg-white text-gray-400 border-gray-200 flex items-center justify-center"
                    >
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...form.options];
                        next[i] = e.target.value;
                        update('options', next);
                      }}
                      placeholder={`보기 ${i + 1}`}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const deletedNo = i + 1;
                        const next = form.options.filter((_, idx) => idx !== i);
                        update('options', next);
                        if (!answerFallback) {
                          // 삭제된 보기 번호를 쓰던 슬롯은 선택 해제, 더 큰 번호는 1 감소 보정
                          commitSlots(slots.map((v) => (v === deletedNo ? 0 : v > deletedNo ? v - 1 : v)));
                        }
                      }}
                      className="shrink-0 text-gray-300 hover:text-red-400 transition"
                      aria-label={`보기 ${i + 1} 삭제`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                {form.options.length < 8 && (
                  <button
                    type="button"
                    onClick={() => update('options', [...form.options, ''])}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition"
                  >
                    + 보기 추가
                  </button>
                )}
              </>
            )}

            {/* ── 정답 슬롯(빈칸 순서대로) — 보기가 있을 때만 노출.
                 기존 answer 파싱에 실패한 경우(레거시·손상 데이터) 원문 텍스트 입력으로 폴백. ── */}
            {hasOptions(form.options) && (
              answerFallback ? (
                <div className="pt-3 mt-1 border-t border-gray-100 space-y-1.5">
                  <label className="block text-xs font-medium text-gray-500">
                    정답 <span className="text-amber-500 font-normal">— 기존 저장값을 자동 해석하지 못해 원문을 직접 수정합니다</span>
                  </label>
                  <input
                    type="text"
                    value={form.answer}
                    onChange={(e) => update('answer', e.target.value)}
                    maxLength={2000}
                    placeholder="예: 4,1,2,3"
                    className="w-full px-3 py-1.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                  />
                </div>
              ) : (
                <div className="pt-3 mt-1 border-t border-gray-100 space-y-2">
                  <label className="block text-xs font-medium text-gray-500">
                    정답 (빈칸 순서대로) <span className="text-gray-300 font-normal">— 같은 번호를 중복 지정할 수 있습니다</span>
                  </label>
                  {slots.length === 0 ? (
                    <button
                      type="button"
                      onClick={addSlot}
                      className="text-xs text-indigo-500 hover:text-indigo-700 transition"
                    >
                      + 빈칸 추가
                    </button>
                  ) : (
                    <>
                      {slots.map((slotVal, si) => (
                        <div key={si} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-20 shrink-0">{si + 1}번째 빈칸</span>
                          <div className="flex flex-wrap gap-1">
                            {form.options.map((_, oi) => (
                              <button
                                key={oi}
                                type="button"
                                onClick={() => selectSlot(si, oi + 1)}
                                className={[
                                  'w-6 h-6 rounded-full text-xs font-bold shrink-0 transition border',
                                  slotVal === oi + 1
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300',
                                ].join(' ')}
                              >
                                {oi + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSlot(si)}
                            className="shrink-0 text-gray-300 hover:text-red-400 transition"
                            aria-label={`${si + 1}번째 빈칸 삭제`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSlot}
                        className="text-xs text-indigo-500 hover:text-indigo-700 transition"
                      >
                        + 빈칸 추가
                      </button>
                    </>
                  )}
                </div>
              )
            )}
          </div>

          {/* ── OX — 보기가 있으면 위 번호 선택 UI로 대체 ── */}
          {form.questionType === 'OX' && !hasOptions(form.options) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">정답</label>
              <div className="flex gap-3">
                {['O', 'X'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => update('answer', v)}
                    className={[
                      'w-12 h-10 rounded-lg text-base font-bold border transition',
                      form.answer === v
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300',
                    ].join(' ')}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SHORT_ANSWER — 보기가 있으면 위 번호 선택 UI로 대체 ── */}
          {form.questionType === 'SHORT_ANSWER' && !hasOptions(form.options) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">정답 (선택)</label>
              <input
                type="text"
                value={form.answer}
                onChange={(e) => update('answer', e.target.value)}
                placeholder="모범 답안을 입력하세요."
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
            </div>
          )}

          {/* 해설 (공통) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">해설 (선택)</label>
            <textarea
              rows={2}
              value={form.explanation}
              onChange={(e) => update('explanation', e.target.value)}
              placeholder="정답 해설을 입력하세요."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* 하단 버튼 */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/admin/exams/questions"
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          취소
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '저장 중...' : '수정 저장'}
        </button>
      </div>
    </div>
  );
}
