'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { examService } from '@/services/examService';
import { domainService } from '@/services/domainService';
import type { QuestionType, DomainSlave, DomainMaster } from '@/types';
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

// ── Types ──────────────────────────────────────────────────────────────────────

interface QuestionDraft {
  localId:      string;
  content:      string;
  questionType: QuestionType;
  options:      string[];
  answer:       string;
  code:         string;
  language:     string;
  categoryId:   number | null;
}

interface ImportedDraft extends QuestionDraft {
  excluded:   boolean;
  sourceHint: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

let _seq = 0;
const uid = () => `q-${++_seq}-${Date.now()}`;

const emptyDraft = (): QuestionDraft => ({
  localId:      uid(),
  content:      '',
  questionType: 'MULTIPLE_CHOICE',
  options:      ['', '', '', ''],
  answer:       '1',
  code:         '',
  language:     'javascript',
  categoryId:   null,
});

function parseTextToQuestions(text: string): ImportedDraft[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const drafts: ImportedDraft[] = [];
  let current: string[] = [];

  const flush = () => {
    const content = current.join(' ').trim();
    if (content.length > 3) {
      drafts.push({
        localId: uid(), content,
        questionType: 'SHORT_ANSWER', options: [], answer: '',
        code: '', language: 'other',
        categoryId: null,
        excluded: false, sourceHint: '클립보드',
      });
    }
    current = [];
  };

  for (const line of lines) {
    if (/^(\d{1,3}[.)]\s|[Qq]\d+[.)]\s|문항\s*\d+\s*[.)：:])/i.test(line)) {
      flush();
      current.push(line.replace(/^(\d{1,3}[.)]\s|[Qq]\d+[.)]\s|문항\s*\d+\s*[.)：:])/i, '').trim());
    } else {
      current.push(line);
    }
  }
  flush();
  return drafts;
}

async function simulateFileParse(file: File): Promise<ImportedDraft[]> {
  return new Promise((resolve) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (['txt', 'csv'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) ?? '';
        resolve(parseTextToQuestions(text).map((d) => ({ ...d, sourceHint: file.name })));
      };
      reader.readAsText(file, 'utf-8');
      return;
    }
    setTimeout(() => {
      const count = Math.min(Math.max(3, Math.floor(file.size / 2000)), 10);
      resolve(
        Array.from({ length: count }, (_, i) => ({
          localId: uid(),
          content: `[${file.name}에서 추출] 문항 ${i + 1} — 서버 파싱 후 내용이 채워집니다.`,
          questionType: 'MULTIPLE_CHOICE' as QuestionType,
          options: ['보기 1', '보기 2', '보기 3', '보기 4'],
          answer: '1', code: '', language: 'other',
          categoryId: null,
          excluded: false, sourceHint: file.name,
        })),
      );
    }, 1200);
  });
}

// ── ManualQuestionCard ─────────────────────────────────────────────────────────

function ManualQuestionCard({
  draft, index, total, onChange, onRemove, allSlaves,
}: {
  draft:     QuestionDraft;
  index:     number;
  total:     number;
  onChange:  (field: string, value: string | string[] | number | null) => void;
  onRemove:  () => void;
  allSlaves: DomainSlave[];
}) {
  const isCode = draft.questionType === 'CODE';

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
        <span className="text-sm font-semibold text-indigo-600">문항 {index + 1}</span>
        {total > 1 && (
          <button type="button" onClick={onRemove}
            className="text-gray-300 hover:text-red-400 transition" aria-label="문항 삭제">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* 유형 선택 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">유형</label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  onChange('questionType', t.value);
                  onChange('options', t.value === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : []);
                  onChange('answer', t.value === 'OX' ? 'O' : '');
                  if (t.value === 'CODE') onChange('language', 'javascript');
                }}
                title={t.desc}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  draft.questionType === t.value
                    ? t.value === 'CODE'
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                ].join(' ')}
              >
                {t.value === 'CODE' && (
                  <span className="mr-1 font-mono">{'{}'}</span>
                )}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 선택 */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            카테고리 <span className="text-red-400">*</span>
          </label>
          <select
            value={draft.categoryId ?? ''}
            onChange={(e) => onChange('categoryId', e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          >
            <option value="">카테고리를 선택하세요</option>
            {allSlaves.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* 문항 내용 (모든 유형 공통) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-gray-500">
              {isCode ? '문제 설명' : '문항 내용'}{' '}
              <span className="text-red-400">*</span>
            </label>
            <ImageUploadButton
              onInsert={(md) => onChange('content', draft.content + '\n' + md)}
            />
          </div>
          <textarea
            rows={isCode ? 2 : 3}
            value={draft.content}
            onChange={(e) => onChange('content', e.target.value)}
            maxLength={5000}
            placeholder={
              isCode
                ? '예: 아래 코드의 실행 결과를 작성하시오.'
                : '문항 내용을 입력하세요.'
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
          />
        </div>

        {/* ── CODE 섹션 ── */}
        {isCode && (
          <div className="space-y-3">
            {/* 언어 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">프로그래밍 언어</label>
              <select
                value={draft.language}
                onChange={(e) => onChange('language', e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* 코드 에디터 — SQL/코드 내용은 JPA 파라미터 바인딩으로 안전하게 저장됨 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                코드 <span className="text-red-400">*</span>
              </label>
              <CodeEditor
                value={draft.code}
                language={draft.language}
                onChange={(v) => onChange('code', v)}
                minRows={10}
              />
            </div>

            {/* 정답 / 예상 출력 */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                정답 / 예상 출력
              </label>
              <textarea
                rows={3}
                value={draft.answer}
                onChange={(e) => onChange('answer', e.target.value)}
                maxLength={2000}
                placeholder="예상 출력값 또는 정답을 입력하세요."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 transition resize-none bg-gray-50"
              />
            </div>
          </div>
        )}

        {/* ── MULTIPLE_CHOICE 보기 ── */}
        {draft.questionType === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-500">보기 (번호 클릭 = 정답 선택)</label>
            {draft.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange('answer', String(i + 1))}
                  className={[
                    'w-6 h-6 rounded-full text-xs font-bold shrink-0 transition border',
                    draft.answer === String(i + 1)
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
                    const next = [...draft.options];
                    next[i] = e.target.value;
                    onChange('options', next);
                  }}
                  maxLength={500}
                  placeholder={`보기 ${i + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
            ))}
            {draft.options.length < 8 && (
              <button
                type="button"
                onClick={() => onChange('options', [...draft.options, ''])}
                className="text-xs text-indigo-500 hover:text-indigo-700 transition"
              >
                + 보기 추가
              </button>
            )}
          </div>
        )}

        {/* ── OX 정답 ── */}
        {draft.questionType === 'OX' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">정답</label>
            <div className="flex gap-3">
              {['O', 'X'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange('answer', v)}
                  className={[
                    'w-12 h-10 rounded-lg text-base font-bold border transition',
                    draft.answer === v
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

        {/* ── SHORT_ANSWER 정답 ── */}
        {draft.questionType === 'SHORT_ANSWER' && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">정답 (선택)</label>
            <input
              type="text"
              value={draft.answer}
              onChange={(e) => onChange('answer', e.target.value)}
              maxLength={2000}
              placeholder="모범 답안을 입력하세요."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminQuestionNewPage() {
  const router = useRouter();

  const [tab, setTab] = useState<'manual' | 'import'>('manual');
  const [manualQuestions, setManualQuestions]     = useState<QuestionDraft[]>([emptyDraft()]);
  const [importedQuestions, setImportedQuestions] = useState<ImportedDraft[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsing,   setParsing]     = useState(false);
  const [parseHint, setParseHint]   = useState('');
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState('');

  // 도메인 (카테고리)
  const [domains, setDomains]             = useState<DomainMaster[]>([]);
  const [importCategory, setImportCategory] = useState<number | null>(null);
  const allSlaves: DomainSlave[]           = domains.flatMap((m) => m.slaves);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 도메인 로드 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    domainService.getDomains()
      .then((res) => setDomains(res.data.data ?? []))
      .catch(() => {}); // 카테고리 목록 로드 실패 시 빈 드롭다운 유지
  }, []);

  // ── Manual helpers ───────────────────────────────────────────────────────────
  const addManualQuestion = () => setManualQuestions((p) => [...p, emptyDraft()]);

  const removeManualQuestion = (id: string) =>
    setManualQuestions((p) => p.filter((q) => q.localId !== id));

  const updateManualQuestion = (id: string, field: string, value: string | string[] | number | null) =>
    setManualQuestions((p) => p.map((q) => (q.localId === id ? { ...q, [field]: value } : q)));

  // ── File / clipboard helpers ─────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    const allowed = ['pdf', 'hwp', 'hwpx', 'xlsx', 'xls', 'csv', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowed.includes(ext)) {
      setError('지원하지 않는 파일 형식입니다. (PDF · HWP · Excel · CSV · TXT)');
      return;
    }
    setParsing(true);
    setParseHint(`"${file.name}" 분석 중...`);
    setError('');
    try {
      const parsed = await simulateFileParse(file);
      setImportedQuestions((p) => [...p, ...parsed]);
    } catch {
      setError('파일 파싱에 실패했습니다.');
    } finally {
      setParsing(false);
      setParseHint('');
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      for (const file of Array.from(e.dataTransfer.files)) await processFile(file);
    },
    [processFile],
  );

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const file of Array.from(e.target.files ?? [])) await processFile(file);
    e.target.value = '';
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { setError('클립보드에 텍스트가 없습니다.'); return; }
      const parsed = parseTextToQuestions(text);
      if (parsed.length === 0) {
        setError('인식된 문항이 없습니다. 번호로 시작하는 텍스트를 붙여넣어 주세요.');
        return;
      }
      setImportedQuestions((p) => [...p, ...parsed]);
      setError('');
    } catch {
      setError('클립보드 접근 권한이 없습니다. 브라우저 설정을 확인하세요.');
    }
  };

  const toggleExclude    = (id: string) =>
    setImportedQuestions((p) => p.map((q) => (q.localId === id ? { ...q, excluded: !q.excluded } : q)));
  const toggleAllImported = (excluded: boolean) =>
    setImportedQuestions((p) => p.map((q) => ({ ...q, excluded })));
  const removeImported   = (id: string) =>
    setImportedQuestions((p) => p.filter((q) => q.localId !== id));

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const manualValid = manualQuestions.filter((q) =>
      q.content.trim() && (q.questionType !== 'CODE' || q.code.trim()) && q.categoryId !== null,
    );
    const importedValid = importedQuestions.filter((q) => !q.excluded && q.content.trim());

    const all = [
      ...manualValid,
      ...importedValid.map((q) => ({ ...q, categoryId: importCategory })),
    ];

    if (all.length === 0) {
      setError('등록할 문항이 없습니다. 내용을 입력하거나 파일을 가져오세요.');
      return;
    }
    if (importedValid.length > 0 && importCategory === null) {
      setError('가져온 문항의 카테고리를 선택해야 합니다.');
      return;
    }
    if (all.some((q) => q.categoryId === null)) {
      setError('모든 문항에 카테고리를 선택해야 합니다.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await examService.adminCreateQuestionsBulk(
        all.map((q) => ({
          content:      q.content.trim(),
          questionType: q.questionType,
          categoryId:   q.categoryId!,
          options:      q.options.length ? q.options.filter(Boolean) : undefined,
          answer:       q.answer || undefined,
          code:         q.code   || undefined,
          language:     q.language || undefined,
        })),
      );
      router.push('/admin/exams/questions');
    } catch {
      setError('문항 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // ── Counts ───────────────────────────────────────────────────────────────────
  const manualFilledCount = manualQuestions.filter((q) =>
    q.content.trim() && (q.questionType !== 'CODE' || q.code.trim()) && q.categoryId !== null,
  ).length;
  const importedAppliedCount = importedQuestions.filter((q) => !q.excluded).length;
  const totalCount           = manualFilledCount + importedAppliedCount;

  // ── Render ───────────────────────────────────────────────────────────────────
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
          <h2 className="text-xl font-semibold text-gray-900">문항 등록</h2>
          <p className="text-sm text-gray-500">문항을 직접 입력하거나 파일로 가져올 수 있습니다.</p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { id: 'manual' as const,  label: '직접 입력',     count: manualFilledCount },
          { id: 'import' as const,  label: '파일 / 클립보드', count: importedAppliedCount },
        ] as const).map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={[
              'px-4 py-1.5 rounded-md text-sm font-medium transition',
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 직접 입력 탭 ── */}
      {tab === 'manual' && (
        <div className="space-y-3">
          {manualQuestions.map((q, idx) => (
            <ManualQuestionCard
              key={q.localId}
              draft={q}
              index={idx}
              total={manualQuestions.length}
              allSlaves={allSlaves}
              onChange={(field, value) => updateManualQuestion(q.localId, field, value)}
              onRemove={() => removeManualQuestion(q.localId)}
            />
          ))}
          <button
            type="button"
            onClick={addManualQuestion}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            문항 추가
          </button>
        </div>
      )}

      {/* ── 파일 / 클립보드 탭 ── */}
      {tab === 'import' && (
        <div className="space-y-4">
          {/* 드래그앤드롭 */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
              isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300',
            ].join(' ')}
          >
            <input ref={fileInputRef} type="file" multiple
              accept=".pdf,.hwp,.hwpx,.xlsx,.xls,.csv,.txt"
              className="hidden" onChange={handleFileInput} />
            {parsing ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-indigo-500">{parseHint}</p>
              </div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300 mx-auto mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm font-medium text-gray-600">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-xs text-gray-400 mt-1">PDF · HWP · Excel (.xlsx/.xls) · CSV · TXT</p>
              </>
            )}
          </div>

          {/* 클립보드 붙여넣기 */}
          <button type="button" onClick={handlePasteFromClipboard}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            클립보드에서 붙여넣기
          </button>

          {/* 가져온 문항 카테고리 선택 */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <label className="text-sm font-medium text-amber-800 whitespace-nowrap shrink-0">
              카테고리 <span className="text-red-400">*</span>
            </label>
            <select
              value={importCategory ?? ''}
              onChange={(e) => setImportCategory(Number(e.target.value) || null)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            >
              <option value="">가져온 문항에 적용할 카테고리 선택</option>
              {allSlaves.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 가져온 문항 목록 */}
          {importedQuestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-sm font-medium text-gray-700">
                  가져온 문항 ({importedAppliedCount}/{importedQuestions.length} 적용)
                </span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => toggleAllImported(false)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 transition">전체 적용</button>
                  <button type="button" onClick={() => toggleAllImported(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition">전체 제외</button>
                </div>
              </div>
              <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {importedQuestions.map((q) => (
                  <li key={q.localId}
                    className={['flex items-start gap-3 px-5 py-3.5 transition-colors',
                      q.excluded ? 'bg-gray-50 opacity-50' : 'bg-white'].join(' ')}>
                    <button type="button" onClick={() => toggleExclude(q.localId)}
                      className={[
                        'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition',
                        q.excluded ? 'border-gray-200 bg-white' : 'border-indigo-500 bg-indigo-500',
                      ].join(' ')} aria-label={q.excluded ? '적용' : '제외'}>
                      {!q.excluded && (
                        <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth={2.5} className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l2.5 2.5L10 3.5" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{q.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{q.sourceHint}</p>
                    </div>
                    <button type="button" onClick={() => removeImported(q.localId)}
                      className="text-gray-300 hover:text-red-400 transition shrink-0 mt-0.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* 하단 요약 + 버튼 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          총 <span className="font-semibold text-indigo-600">{totalCount}개</span> 문항이 등록됩니다.
          {manualFilledCount > 0 && <span className="text-gray-400 ml-1">(직접 {manualFilledCount})</span>}
          {importedAppliedCount > 0 && <span className="text-gray-400 ml-1">(가져오기 {importedAppliedCount})</span>}
        </p>
        <div className="flex gap-3 shrink-0">
          <Link href="/admin/exams/questions"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            취소
          </Link>
          <button type="button" onClick={handleSubmit}
            disabled={loading || totalCount === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {loading ? '등록 중...' : `문항 ${totalCount}개 등록`}
          </button>
        </div>
      </div>
    </div>
  );
}
