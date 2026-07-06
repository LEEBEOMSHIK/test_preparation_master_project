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
import { TableSkeleton } from '@/components/ui/Skeleton';
import { stripHtml } from '@/lib/html';

// ── Constants ──────────────────────────────────────────────────────────────────

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: '객관식',   desc: '보기 중 정답 선택' },
  { value: 'SHORT_ANSWER',    label: '주관식',   desc: '직접 답 작성' },
  { value: 'OX',              label: 'O/X',     desc: '참/거짓 판별' },
  { value: 'CODE',            label: '코드',    desc: '프로그래밍 문제' },
  { value: 'SCHEDULING',      label: '스케줄링', desc: 'CPU 스케줄링 문제' },
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
}

const defaultForm = (): FormState => ({
  title:        '',
  examYear:     '',
  examRound:    '',
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
        setForm({
          title:        q.title ?? '',
          examYear:     q.examYear != null ? String(q.examYear) : '',
          examRound:    q.examRound != null ? String(q.examRound) : '',
          instruction:  q.instruction ?? '',
          content:      q.content,
          questionType: q.questionType,
          options:      q.options?.length ? q.options : ['', '', '', ''],
          answer:       q.answer ?? (q.questionType === 'OX' ? 'O' : q.questionType === 'MULTIPLE_CHOICE' ? '1' : ''),
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
        });
      })
      .catch(() => setError('문항 정보를 불러오지 못했습니다.'))
      .finally(() => setFetching(false));
  }, [id]);

  const update = (field: keyof FormState, value: string | string[] | number | null | QuestionAnalysis | SchedulingDataDraft) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /** AI 분석 완료 콜백 — state 갱신 + DB 즉시 저장(silent 실패) */
  const handleAnalyzed = (result: QuestionAnalysis) => {
    update('aiAnalysis', result);
    questionAnalysisService.saveAnalysis(id, result).catch(() => {});
  };

  const handleTypeChange = (type: QuestionType) => {
    setForm((prev) => ({
      ...prev,
      questionType: type,
      options:  type === 'MULTIPLE_CHOICE' ? (prev.options.length ? prev.options : ['', '', '', '']) : [],
      answer:   type === 'OX' ? 'O' : type === 'MULTIPLE_CHOICE' ? '1' : '',
      language: type === 'CODE' ? (prev.language || 'javascript') : prev.language,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim())  { setError('문항 제목을 입력하세요.'); return; }
    if (!form.examTypeId)    { setError('시험 유형을 선택하세요.'); return; }
    if (!form.categoryId)    { setError('문항 유형을 선택하세요.'); return; }
    if (!stripHtml(form.content) && !form.instruction.trim()) {
      setError('발문 또는 문항 내용 중 하나는 입력하세요.');
      return;
    }
    if (form.questionType === 'CODE' && !form.code.trim()) { setError('코드를 입력하세요.'); return; }

    setError('');
    setLoading(true);
    try {
      await examService.adminUpdateQuestion(id, {
        title:        form.title.trim() || undefined,
        examYear:     form.examYear ? Number(form.examYear) : undefined,
        examRound:    form.examRound ? Number(form.examRound) : undefined,
        instruction:  form.instruction.trim() || undefined,
        content:      form.content.trim(),
        questionType: form.questionType,
        categoryId:   form.categoryId ?? undefined,
        examTypeId:   form.examTypeId ?? undefined,
        options:      form.questionType === 'MULTIPLE_CHOICE' ? form.options.filter(Boolean) : undefined,
        answer:       form.answer || undefined,
        code:         form.code   || undefined,
        language:     form.language || undefined,
        explanation:  form.explanation || undefined,
        schedulingData: isScheduling ? toSchedulingDataPayload(form.schedulingData) : undefined,
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

  const editExamTypeName   = examTypeSlaves.find((s) => s.id === form.examTypeId)?.name ?? '';
  const editCategoryName   = questionTypeSlaves.find((s) => s.id === form.categoryId)?.name ?? '';
  const titleSuggestion    = [
    form.examYear  ? `${form.examYear}년`    : '',
    form.examRound ? `제${form.examRound}회` : '',
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

          {/* 시험 연도 / 회차 */}
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
            </div>
          )}

          {/* ── MULTIPLE_CHOICE ── */}
          {form.questionType === 'MULTIPLE_CHOICE' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-500">보기 (번호 클릭 = 정답 선택)</label>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => update('answer', String(i + 1))}
                    className={[
                      'w-6 h-6 rounded-full text-xs font-bold shrink-0 transition border',
                      form.answer === String(i + 1)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
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
            </div>
          )}

          {/* ── OX ── */}
          {form.questionType === 'OX' && (
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

          {/* ── SHORT_ANSWER ── */}
          {form.questionType === 'SHORT_ANSWER' && (
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
