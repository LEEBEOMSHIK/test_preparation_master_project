'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { conceptNoteService } from '@/services/conceptNoteService';
import type { ExaminationDetail, Question } from '@/types';

const CIRCLED = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
const circled = (n: number) => CIRCLED[n - 1] ?? `(${n})`;

// ── 답안 현황에 표시할 답안 텍스트 ───────────────────────────────────────────
function answerLabel(q: Question, userAnswer: string | undefined): string {
  if (!userAnswer) return '';
  if (q.questionType === 'MULTIPLE_CHOICE') return circled(Number(userAnswer));
  if (q.questionType === 'OX') return userAnswer;
  // 단답형 / 코드: 더 넓게 보여줌
  if (userAnswer.length <= 12) return userAnswer;
  return userAnswer.slice(0, 11) + '…';
}

// ── 코드 블록 (IntelliJ Darcula 스타일) ──────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language?: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[#3c3f41] text-left">
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

// ── 문제 본문 (img 태그 지원) ─────────────────────────────────────────────────
function QuestionContent({ content }: { content: string }) {
  if (content.includes('<img')) {
    return (
      <div
        className="text-gray-800 text-sm leading-relaxed [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:block"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>;
}

export default function ExamTakingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const examId = Number(id);

  const [exam, setExam] = useState<ExaminationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(60 * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [result, setResult] = useState<{ total: number; correct: number; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flagAlert, setFlagAlert] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const examDone = useRef(false);

  // 개념노트 모달
  const [noteModal, setNoteModal] = useState(false);
  const [noteQuestionId, setNoteQuestionId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    examinationService.userGetExaminationDetail(examId).then(res => {
      if (res.data.success && res.data.data) {
        const detail = res.data.data;
        setExam(detail);
        setSecondsLeft(detail.timeLimit * 60);
      }
    }).finally(() => setLoading(false));
  }, [examId]);

  // 브라우저 닫기 / 새로고침 경고
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examDone.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // 브라우저 뒤로가기 경고
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      if (examDone.current) return;
      window.history.pushState(null, '', window.location.href);
      setLeaveConfirm(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 타이머
  useEffect(() => {
    if (!exam || result) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(timerRef.current!); setTimeUp(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [exam, result]);

  const questions: Question[] = exam?.questions ?? [];
  const q = questions[current];

  const handleAnswer = useCallback((qId: number, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  }, []);

  const toggleFlag = useCallback((qId: number) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (flagged.size > 0) { setFlagAlert(true); return; }
    if (!confirm('시험을 제출하시겠습니까?')) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    try {
      const res = await examinationService.userSubmitExamination(examId, answers);
      if (res.data.success && res.data.data) {
        examDone.current = true;
        setResult(res.data.data);
      }
    } finally { setSubmitting(false); }
  };

  const openNoteModal = useCallback((q: Question, idx: number) => {
    setNoteQuestionId(q.id);
    setNoteTitle(`Q${idx + 1}. ${q.content.slice(0, 40)}${q.content.length > 40 ? '…' : ''}`);
    setNoteContent('');
    setNoteSaved(false);
    setNoteModal(true);
  }, []);

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setNoteSaving(true);
    try {
      await conceptNoteService.create({
        title: noteTitle.trim(),
        content: noteContent.trim(),
        isPublic: false,
        questionId: noteQuestionId ?? undefined,
      });
      setNoteSaved(true);
      setTimeout(() => setNoteModal(false), 800);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleLeaveConfirmed = () => {
    examDone.current = true;
    router.push('/user/exams');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">시험 불러오는 중...</p>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-500">시험 문항이 없습니다.</p>
        <button onClick={() => router.push('/user/exams')} className="text-sm text-indigo-600 hover:underline">
          시험 목록으로
        </button>
      </div>
    );
  }

  // 결과 화면
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto py-10 space-y-6 text-center">
          <div className={[
            'w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold',
            result.score >= 80 ? 'bg-green-100 text-green-600' :
            result.score >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600',
          ].join(' ')}>
            {result.score}점
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">시험 완료</h2>
            <p className="text-gray-500 text-sm mt-1">
              {result.total}문제 중 <span className="font-semibold text-indigo-600">{result.correct}문제</span> 정답
            </p>
          </div>
          <button onClick={() => router.push('/user/exams')}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
            시험 목록으로
          </button>
        </div>
      </div>
    );
  }

  // 시간 초과
  if (timeUp) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">시간이 종료되었습니다</h2>
        <button
          onClick={async () => {
            setSubmitting(true);
            try {
              const res = await examinationService.userSubmitExamination(examId, answers);
              if (res.data.success && res.data.data) {
                examDone.current = true;
                setResult(res.data.data);
              }
            } finally { setSubmitting(false); }
          }}
          disabled={submitting}
          className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition"
        >
          {submitting ? '채점 중...' : '결과 확인'}
        </button>
      </div>
    );
  }

  const isMultiple = q.questionType === 'MULTIPLE_CHOICE';
  const isOX = q.questionType === 'OX';
  const isCode = q.questionType === 'CODE';
  const isFlagged = flagged.has(q.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 나가기 확인 모달 */}
      {leaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">시험을 나가시겠습니까?</h3>
            <p className="text-sm text-gray-600">모든 시험 정보가 초기화됩니다. 그래도 진행하시겠습니까?</p>
            <div className="flex gap-2">
              <button onClick={() => setLeaveConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition">
                취소
              </button>
              <button onClick={handleLeaveConfirmed}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition">
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 플래그 알림 모달 */}
      {flagAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-gray-900">체크된 문항이 있습니다</h3>
            <p className="text-sm text-gray-600">아래 문항을 다시 확인해 주세요.</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(flagged).map(qId => {
                const idx = questions.findIndex(q => q.id === qId);
                return (
                  <button key={qId} onClick={() => { setCurrent(idx); setFlagAlert(false); }}
                    className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition">
                    {idx + 1}번
                  </button>
                );
              })}
            </div>
            <button onClick={() => setFlagAlert(false)}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 개념노트 모달 */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={e => { if (e.target === e.currentTarget) setNoteModal(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-indigo-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                개념노트
              </h3>
              <button onClick={() => setNoteModal(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <input
              type="text"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              placeholder="제목"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <textarea
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="이 문제에서 기억할 개념을 메모하세요..."
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setNoteModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
                취소
              </button>
              <button
                onClick={handleSaveNote}
                disabled={noteSaving || !noteContent.trim() || noteSaved}
                className={[
                  'px-4 py-2 text-sm rounded-lg font-medium transition',
                  noteSaved
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50',
                ].join(' ')}>
                {noteSaved ? '저장됨 ✓' : noteSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          <button onClick={() => setLeaveConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            나가기
          </button>
          <h1 className="font-semibold text-gray-900 text-sm truncate mx-4 flex-1 text-center">{exam.title}</h1>
          <div className={['font-mono font-bold text-base', secondsLeft <= 300 ? 'text-red-500' : 'text-gray-700'].join(' ')}>
            {formatTime(secondsLeft)}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 mt-14 p-4">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4">

          {/* ── 왼쪽: 문제 영역 ── */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
              {/* 문제 번호 + 체크 버튼 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-indigo-600">Q{current + 1}.</span>
                <button onClick={() => toggleFlag(q.id)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition',
                    isFlagged
                      ? 'bg-amber-100 border-amber-400 text-amber-700'
                      : 'bg-white border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600',
                  ].join(' ')}>
                  <svg viewBox="0 0 24 24" fill={isFlagged ? 'currentColor' : 'none'}
                    stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 21V5a2 2 0 012-2h9.172a2 2 0 011.414.586l2.828 2.828A2 2 0 0119 7.828V21M3 21h16M3 21l2-4h12l2 4" />
                  </svg>
                  {isFlagged ? '체크됨' : '나중에 확인'}
                </button>
                <button
                  onClick={() => openNoteModal(q, current)}
                  title="개념노트 작성"
                  className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-gray-400 border border-transparent hover:border-gray-200 hover:text-indigo-500 hover:bg-indigo-50 transition"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  메모
                </button>
                <span className="text-xs text-gray-400">{current + 1} / {questions.length}</span>
              </div>

              {/* 문제 본문 (이미지 포함 가능) */}
              <QuestionContent content={q.content} />

              {/* 코드 블록 (CODE 유형 또는 code 필드가 있는 경우) */}
              {q.code && <CodeBlock code={q.code} language={q.language} />}

              {/* 선택지 (객관식) */}
              {isMultiple && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const val = String(idx + 1);
                    const selected = answers[q.id] === val;
                    return (
                      <button key={idx} onClick={() => handleAnswer(q.id, val)}
                        className={[
                          'w-full text-left px-4 py-3 rounded-xl border text-sm transition',
                          selected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
                            : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50',
                        ].join(' ')}>
                        <span className="font-semibold mr-2">{circled(idx + 1)}</span>{opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* OX */}
              {isOX && (
                <div className="flex gap-3">
                  {['O', 'X'].map(val => (
                    <button key={val} onClick={() => handleAnswer(q.id, val)}
                      className={[
                        'flex-1 py-5 rounded-xl border text-2xl font-bold transition',
                        answers[q.id] === val
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-indigo-300',
                      ].join(' ')}>
                      {val}
                    </button>
                  ))}
                </div>
              )}

              {/* 단답형 / 코드 답안 입력 */}
              {!isMultiple && !isOX && (
                isCode ? (
                  <textarea
                    value={answers[q.id] ?? ''}
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    placeholder="답을 입력하세요"
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                  />
                ) : (
                  <input
                    value={answers[q.id] ?? ''}
                    onChange={e => handleAnswer(q.id, e.target.value)}
                    placeholder="답을 입력하세요"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                )
              )}

              {/* 이전 / 다음 */}
              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
                  이전
                </button>
                <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                  disabled={current === questions.length - 1}
                  className="flex-1 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-sm font-medium hover:bg-indigo-100 disabled:opacity-40 transition">
                  다음
                </button>
              </div>
            </div>
          </div>

          {/* ── 오른쪽: 답안지 ── */}
          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
              <p className="text-xs font-semibold text-gray-500 mb-3">답안 현황</p>

              {/* 수직 목록: 문항번호(좌) | 답안(우) 수평 배치 */}
              <div className="space-y-1">
                {questions.map((question, idx) => {
                  const userAnswer = answers[question.id];
                  const isAnswered = !!userAnswer;
                  const isCurrentQ = idx === current;
                  const isFlaggedQ = flagged.has(question.id);
                  const label = answerLabel(question, userAnswer);

                  return (
                    <button
                      key={question.id}
                      onClick={() => setCurrent(idx)}
                      className={[
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition relative',
                        isFlaggedQ ? 'bg-amber-200 text-amber-800 border border-amber-400 font-semibold' :
                        isCurrentQ ? 'bg-indigo-100 text-indigo-700 border border-indigo-300 ring-1 ring-indigo-400' :
                        isAnswered ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-gray-50 text-gray-400 border border-gray-200 hover:border-indigo-300',
                      ].join(' ')}
                    >
                      <span className={['shrink-0 w-7 text-left', isCurrentQ ? 'text-indigo-400' : 'text-gray-500'].join(' ')}>
                        {idx + 1}번
                      </span>
                      <span className="flex-1 min-w-0 font-bold text-sm truncate text-right">
                        {label || <span className="font-normal opacity-30">—</span>}
                      </span>
                      {isFlaggedQ && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 범례 */}
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-200 shrink-0" />
                  답변 완료 ({Object.keys(answers).length}/{questions.length})
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300 shrink-0" />
                  체크 ({flagged.size}개)
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-medium hover:bg-indigo-100 disabled:opacity-50 transition">
              {submitting ? '채점 중...' : '시험 제출'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
