'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { conceptNoteService } from '@/services/conceptNoteService';
import type { ExaminationDetail, ExaminationSubmitResult, ExamHistoryDetailResult, Question, ConceptNote } from '@/types';
import { RichContent } from '@/components/ui/RichContent';
import { QuizCardSkeleton } from '@/components/ui/Skeleton';
import { ExamResultDisplay } from '@/components/ui/ExamResultDisplay';
import { ConceptNoteModal } from '@/components/ui/ConceptNoteModal';
import { stripHtml } from '@/lib/html';

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


export default function ExamTakingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const examId = Number(id);

  const [exam, setExam] = useState<ExaminationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  // 초기값 0 — 서버 세션에서 받아 세팅
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [result, setResult] = useState<ExaminationSubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flagAlert, setFlagAlert] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const examDone = useRef(false);

  // 1분 경고 배너
  const warningShown = useRef(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);

  // submitExam 최신 클로저 — setInterval stale closure 방지
  const submitFnRef = useRef<((isAutoSubmit: boolean) => Promise<void>) | null>(null);

  // 개념노트 모달 — 대상 문항(없으면 닫힘)
  const [noteTarget, setNoteTarget] = useState<{ question: Question; idx: number } | null>(null);
  const [questionNotes, setQuestionNotes] = useState<Record<number, ConceptNote>>({});

  // ── 마운트 effect: 순차 await ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // ① 시험 상세 조회
        const detailRes = await examinationService.userGetExaminationDetail(examId);
        if (cancelled) return;
        if (detailRes.data.success && detailRes.data.data) {
          const detail = detailRes.data.data;
          setExam(detail);

          // 개념노트 비동기 병행 — 결과 화면 분기에 영향 없음
          conceptNoteService.getMyNotes(0, 500).then(notesRes => {
            if (cancelled) return;
            if (notesRes.data.success && notesRes.data.data) {
              const qIds = new Set(detail.questions.map(q => q.id));
              const map: Record<number, ConceptNote> = {};
              notesRes.data.data.content.forEach(note => {
                if (note.questionId && qIds.has(note.questionId)) {
                  map[note.questionId] = note;
                }
              });
              setQuestionNotes(map);
            }
          });
        }

        // ② 이전 응시 결과 조회 — 성공이면 결과 화면으로, 404이면 세션 시작
        try {
          const latestRes = await examinationService.userGetLatestResult(examId);
          if (cancelled) return;
          if (latestRes.data.success && latestRes.data.data) {
            const saved: ExamHistoryDetailResult = latestRes.data.data;
            const restored: ExaminationSubmitResult = {
              historyId: saved.historyId,
              total: saved.total,
              correct: saved.correct,
              score: saved.score,
              results: saved.results,
            };
            setResult(restored);
            examDone.current = true;
            return; // 이미 완료된 시험 — start 호출 생략
          }
        } catch {
          // 미응시(404) 또는 오류 → 세션 시작으로 진행
        }

        // ③ 세션 시작 (또는 재개)
        const sessionRes = await examinationService.userStartExam(examId, false);
        if (cancelled) return;
        if (sessionRes.data.success && sessionRes.data.data) {
          setSecondsLeft(Math.max(0, sessionRes.data.data.remainingSeconds));
        }
      } catch {
        // 시험 상세 조회 자체 실패 — 목록으로 이동
        if (!cancelled) router.push('/user/exams');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [examId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const questions: Question[] = exam?.questions ?? [];

  // ── 단일 제출 함수 ────────────────────────────────────────────────────────
  const submitExam = useCallback(async (isAutoSubmit: boolean) => {
    if (examDone.current || submitting) return;

    if (!isAutoSubmit) {
      // 플래그 문항 있으면 알림 먼저
      if (flagged.size > 0) { setFlagAlert(true); return; }
      if (!confirm('시험을 제출하시겠습니까?')) return;
    }

    setSubmitting(true);
    clearInterval(timerRef.current ?? undefined);

    try {
      const res = await examinationService.userSubmitExamination(examId, answers);
      if (res.data.success && res.data.data) {
        examDone.current = true;
        setResult(res.data.data);
      }
    } finally {
      setSubmitting(false);
    }
  }, [examId, answers, flagged, submitting]);

  // submitFnRef 를 매 렌더에서 최신 클로저로 갱신
  useEffect(() => {
    submitFnRef.current = submitExam;
  });

  // ── 타이머 effect ─────────────────────────────────────────────────────────
  // 조건: 아직 결과가 없고 secondsLeft > 0 일 때 틱
  const timerActive = !result && secondsLeft > 0;
  useEffect(() => {
    if (!timerActive) {
      // secondsLeft 가 0인데 result 도 없는 경우(로드 후 이미 만료) → 즉시 자동제출
      if (!result && secondsLeft === 0 && !loading) {
        submitFnRef.current?.(true);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        const next = s - 1;
        if (next === 60 && !warningShown.current) {
          warningShown.current = true;
          setShowWarningBanner(true);
          setTimeout(() => setShowWarningBanner(false), 8000);
        }
        if (next <= 0) {
          clearInterval(timerRef.current!);
          submitFnRef.current?.(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [timerActive]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const openNoteModal = useCallback((q: Question, idx: number) => {
    setNoteTarget({ question: q, idx });
  }, []);

  const handleLeaveConfirmed = () => {
    examDone.current = true;
    router.push('/user/exams');
  };

  // 다시 풀기 — 세션 reset 후 타이머 재시작
  const handleRetake = useCallback(async () => {
    setResult(null);
    setAnswers({});
    setFlagged(new Set());
    setCurrent(0);
    warningShown.current = false;
    setShowWarningBanner(false);
    examDone.current = false;

    try {
      const sessionRes = await examinationService.userStartExam(examId, true);
      if (sessionRes.data.success && sessionRes.data.data) {
        setSecondsLeft(Math.max(0, sessionRes.data.data.remainingSeconds));
      } else {
        // 폴백: exam.timeLimit 기준
        setSecondsLeft((exam?.timeLimit ?? 60) * 60);
      }
    } catch {
      setSecondsLeft((exam?.timeLimit ?? 60) * 60);
    }
  }, [examId, exam]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <QuizCardSkeleton />
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
      <ExamResultDisplay
        result={result}
        examinationTitle={exam?.title}
        onBack={() => router.push('/user/exams')}
        backLabel="시험 목록으로"
        showSavedBanner
        onRetake={handleRetake}
      />
    );
  }

  const q = questions[current];
  const isMultiple = q.questionType === 'MULTIPLE_CHOICE';
  const isOX = q.questionType === 'OX';
  const isCode = q.questionType === 'CODE';
  const isFlagged = flagged.has(q.id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1분 경고 배너 */}
      {showWarningBanner && (
        <div className="fixed top-14 inset-x-0 z-50 flex justify-center pointer-events-none">
          <div className="mx-4 max-w-md w-full bg-amber-50 border border-amber-400 text-amber-800 text-sm font-medium px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0 text-amber-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            1분 남았습니다. 답안을 확인하세요.
          </div>
        </div>
      )}

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

      {/* 개념노트 모달 (공용) */}
      {noteTarget && (
        <ConceptNoteModal
          key={noteTarget.question.id}
          defaultTitle={`Q${noteTarget.idx + 1}. ${stripHtml(noteTarget.question.content).slice(0, 40)}`}
          existingNote={questionNotes[noteTarget.question.id] ?? null}
          link={{ questionId: noteTarget.question.id }}
          onClose={() => setNoteTarget(null)}
          onSaved={(note) =>
            setQuestionNotes(prev => ({ ...prev, [noteTarget.question.id]: note }))
          }
        />
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
            {submitting ? '채점 중...' : formatTime(secondsLeft)}
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
                  className={[
                    'ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border transition',
                    questionNotes[q.id]
                      ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                      : 'text-gray-400 border-transparent hover:border-gray-200 hover:text-indigo-500 hover:bg-indigo-50',
                  ].join(' ')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  {questionNotes[q.id] ? '노트' : '메모'}
                </button>
                <span className="text-xs text-gray-400">{current + 1} / {questions.length}</span>
              </div>

              {/* 문제 본문 (이미지 포함 가능) */}
              <RichContent html={q.content} className="text-gray-800 text-sm" />

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

            <button onClick={() => submitExam(false)} disabled={submitting}
              className="w-full py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-medium hover:bg-indigo-100 disabled:opacity-50 transition">
              {submitting ? '채점 중...' : '시험 제출'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
