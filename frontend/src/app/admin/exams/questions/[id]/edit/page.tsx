'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { examService } from '@/services/examService';
import type { QuestionType } from '@/types';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { ImageUploadButton } from '@/components/ui/ImageUploadButton';

// ── Constants ──────────────────────────────────────────────────────────────────

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: '객관식', desc: '보기 중 정답 선택' },
  { value: 'SHORT_ANSWER',    label: '주관식', desc: '직접 답 작성' },
  { value: 'OX',              label: 'O/X',   desc: '참/거짓 판별' },
  { value: 'CODE',            label: '코드',  desc: '프로그래밍 문제' },
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
  content:      string;
  questionType: QuestionType;
  options:      string[];
  answer:       string;
  code:         string;
  language:     string;
  explanation:  string;
}

const defaultForm = (): FormState => ({
  content:      '',
  questionType: 'MULTIPLE_CHOICE',
  options:      ['', '', '', ''],
  answer:       '1',
  code:         '',
  language:     'javascript',
  explanation:  '',
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

  // 기존 문항 로드
  useEffect(() => {
    examService.adminGetQuestion(id)
      .then((res) => {
        const q = res.data.data;
        if (!q) return;
        setForm({
          content:      q.content,
          questionType: q.questionType,
          options:      q.options?.length ? q.options : ['', '', '', ''],
          answer:       q.answer ?? (q.questionType === 'OX' ? 'O' : q.questionType === 'MULTIPLE_CHOICE' ? '1' : ''),
          code:         q.code ?? '',
          language:     q.language ?? 'javascript',
          explanation:  q.explanation ?? '',
        });
      })
      .catch(() => setError('문항 정보를 불러오지 못했습니다.'))
      .finally(() => setFetching(false));
  }, [id]);

  const update = (field: keyof FormState, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
    if (!form.content.trim()) { setError('문항 내용을 입력하세요.'); return; }
    if (form.questionType === 'CODE' && !form.code.trim()) { setError('코드를 입력하세요.'); return; }

    setError('');
    setLoading(true);
    try {
      await examService.adminUpdateQuestion(id, {
        content:      form.content.trim(),
        questionType: form.questionType,
        options:      form.questionType === 'MULTIPLE_CHOICE' ? form.options.filter(Boolean) : undefined,
        answer:       form.answer || undefined,
        code:         form.code   || undefined,
        language:     form.language || undefined,
        explanation:  form.explanation || undefined,
      });
      router.push('/admin/exams/questions');
    } catch {
      setError('문항 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const isCode = form.questionType === 'CODE';

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
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
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 space-y-5">

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

          {/* 문항 내용 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-500">
                {isCode ? '문제 설명' : '문항 내용'}{' '}
                <span className="text-red-400">*</span>
              </label>
              <ImageUploadButton
                onInsert={(md) => update('content', form.content + '\n' + md)}
              />
            </div>
            <textarea
              rows={isCode ? 2 : 3}
              value={form.content}
              onChange={(e) => update('content', e.target.value)}
              placeholder={isCode ? '예: 아래 코드의 실행 결과를 작성하시오.' : '문항 내용을 입력하세요.'}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
            />
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
