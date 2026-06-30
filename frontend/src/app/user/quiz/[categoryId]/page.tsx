'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { quizService, type QuizQuestion, type CheckResult } from '@/services/quizService';
import { bookmarkService } from '@/services/bookmarkService';
import { conceptNoteService } from '@/services/conceptNoteService';
import { RichContent } from '@/components/ui/RichContent';
import { QuizCardSkeleton } from '@/components/ui/Skeleton';
import { ConceptNoteModal } from '@/components/ui/ConceptNoteModal';
import { ExamResultDisplay } from '@/components/ui/ExamResultDisplay';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { CodeAnswerInput } from '@/components/ui/CodeAnswerInput';
import { stripHtml } from '@/lib/html';
import type { ConceptNote, ExamResultData, QuestionResult, QuestionType } from '@/types';

type Phase = 'loading' | 'quiz' | 'continue' | 'result';

interface AnswerState {
  userAnswer: string;
  submitted: boolean;
  result?: CheckResult;
}

/** 세션 내 채점 완료 문항 누적 기록 (이 파일 전용) */
interface SessionResultItem {
  question: QuizQuestion;
  userAnswer: string;
  checkResult: CheckResult;
}

/** SessionResultItem[] → ExamResultData 매핑 (순수 함수) */
function mapSessionResultsToExamResultData(items: SessionResultItem[]): ExamResultData {
  const total = items.length;
  const correct = items.filter(item => item.checkResult.correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const results: QuestionResult[] = items.map((item, i) => ({
    questionId: item.question.id,
    seq: i + 1,
    content: item.question.content,
    questionType: item.question.questionType as QuestionType,
    options: item.question.options,
    userAnswer: item.userAnswer,
    correctAnswer: item.checkResult.answer,
    correct: item.checkResult.correct,
    explanation: item.checkResult.explanation,
    code: item.question.code,
    language: item.question.language,
  }));
  return { total, correct, score, results };
}

// ── Inner component (useSearchParams 사용) ────────────────────────────────────
function QuizPlayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const categoryId = Number(params.categoryId);
  const categoryName = searchParams.get('name') ?? '퀴즈';

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerState>>({});
  const [inputValue, setInputValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [roundNum, setRoundNum] = useState(1);

  // Accumulated across batches
  const [sessionAnswered, setSessionAnswered] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  // 세션 내 채점 완료 문항 누적 (결과 화면용)
  const [sessionResults, setSessionResults] = useState<SessionResultItem[]>([]);

  // 북마크 상태
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());
  const [togglingBookmarkId, setTogglingBookmarkId] = useState<number | null>(null);

  // 개념노트 상태 — questionBankId 기준으로 저장된 노트 맵 + 모달 대상 문항
  const [questionNotes, setQuestionNotes] = useState<Record<number, ConceptNote>>({});
  const [noteTarget, setNoteTarget] = useState<QuizQuestion | null>(null);

  // Derived from current batch
  const correctCount = Object.values(answers).filter(a => a.result?.correct).length;
  const answeredCount = Object.values(answers).filter(a => a.submitted).length;

  const loadBatch = useCallback(() => {
    setPhase('loading');
    quizService.getQuestions(categoryId, 10).then(res => {
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setQuestions(res.data.data);
        setAnswers({});
        setCurrent(0);
        setInputValue('');
        setPhase('quiz');
      } else {
        alert('이 카테고리에 등록된 문항이 없습니다.');
        router.push('/user/quiz');
      }
    });
  }, [categoryId, router]);

  useEffect(() => {
    loadBatch();
  }, [categoryId]);

  // 마운트 시 북마크 ID 목록 초기화 — 실패해도 퀴즈 진행 막지 않음
  useEffect(() => {
    bookmarkService.getBookmarkedIds()
      .then((res) => {
        if (res.data.success && res.data.data) {
          setBookmarkedIds(new Set(res.data.data));
        }
      })
      .catch(() => {
        setBookmarkedIds(new Set());
      });
  }, []);

  // 마운트 시 내 개념노트 중 퀴즈 문항(questionBankId)에 연결된 것 매핑 — 실패해도 무시
  useEffect(() => {
    conceptNoteService.getMyNotes(0, 500)
      .then((res) => {
        if (res.data.success && res.data.data) {
          const map: Record<number, ConceptNote> = {};
          res.data.data.content.forEach((note) => {
            if (note.questionBankId) map[note.questionBankId] = note;
          });
          setQuestionNotes(map);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleBookmark = useCallback(async (questionId: number) => {
    if (togglingBookmarkId === questionId) return;
    setTogglingBookmarkId(questionId);
    try {
      const res = await bookmarkService.toggle(questionId);
      if (res.data.success && res.data.data !== undefined) {
        const bookmarked = res.data.data.bookmarked;
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (bookmarked) {
            next.add(questionId);
          } else {
            next.delete(questionId);
          }
          return next;
        });
      }
    } catch {
      // 실패 시 상태 유지
    } finally {
      setTogglingBookmarkId(null);
    }
  }, [togglingBookmarkId]);

  const q = questions[current];
  const answerState = q ? answers[q.id] : undefined;

  // Flush current batch progress into session totals
  const flushBatch = useCallback((currentAnswers: Record<number, AnswerState>) => {
    const batchAnswered = Object.values(currentAnswers).filter(a => a.submitted).length;
    const batchCorrect = Object.values(currentAnswers).filter(a => a.result?.correct).length;
    setSessionAnswered(prev => prev + batchAnswered);
    setSessionCorrect(prev => prev + batchCorrect);
  }, []);

  const handleStop = () => {
    flushBatch(answers);
    setPhase('result');
  };

  const handleRetake = () => {
    setSessionAnswered(0);
    setSessionCorrect(0);
    setSessionResults([]);
    setRoundNum(1);
    loadBatch();
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setInputValue('');
    } else {
      flushBatch(answers);
      setPhase('continue');
    }
  };

  const handleContinue = () => {
    setRoundNum(r => r + 1);
    loadBatch();
  };

  const handleSubmitAnswer = useCallback(async () => {
    if (!q || !inputValue.trim() || checking) return;
    setChecking(true);
    try {
      const res = await quizService.checkAnswer(q.id, inputValue.trim());
      if (res.data.success && res.data.data) {
        setAnswers(prev => ({
          ...prev,
          [q.id]: { userAnswer: inputValue.trim(), submitted: true, result: res.data.data! },
        }));
        setSessionResults(prev => [
          ...prev,
          { question: q, userAnswer: inputValue.trim(), checkResult: res.data.data! },
        ]);
      }
    } finally {
      setChecking(false);
    }
  }, [q, inputValue, checking]);

  const handleSelectOption = useCallback(async (_: string, idx: number) => {
    if (!q || answerState?.submitted) return;
    const userAnswer = String(idx + 1);
    setChecking(true);
    try {
      const res = await quizService.checkAnswer(q.id, userAnswer);
      if (res.data.success && res.data.data) {
        setAnswers(prev => ({
          ...prev,
          [q.id]: { userAnswer, submitted: true, result: res.data.data! },
        }));
        setSessionResults(prev => [
          ...prev,
          { question: q, userAnswer, checkResult: res.data.data! },
        ]);
      }
    } finally {
      setChecking(false);
    }
  }, [q, answerState]);

  const handleSelectOX = useCallback(async (val: 'O' | 'X') => {
    if (!q || answerState?.submitted || checking) return;
    setChecking(true);
    try {
      const res = await quizService.checkAnswer(q.id, val);
      if (res.data.success && res.data.data) {
        setAnswers(prev => ({
          ...prev,
          [q.id]: { userAnswer: val, submitted: true, result: res.data.data! },
        }));
        setSessionResults(prev => [
          ...prev,
          { question: q, userAnswer: val, checkResult: res.data.data! },
        ]);
      }
    } finally {
      setChecking(false);
    }
  }, [q, answerState, checking]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return <QuizCardSkeleton />;
  }

  // ── Continue (end of batch) ────────────────────────────────────────────────
  if (phase === 'continue') {
    const roundScore = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    return (
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <div className={[
          'rounded-2xl border p-8 text-center shadow-sm',
          roundScore >= 80 ? 'bg-green-50 border-green-200'
          : roundScore >= 50 ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200',
        ].join(' ')}>
          <div className={[
            'w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-4',
            roundScore >= 80 ? 'bg-green-100 text-green-700'
            : roundScore >= 50 ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700',
          ].join(' ')}>
            {roundScore}
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            라운드 {roundNum} 완료
          </p>
          <p className="text-lg font-bold text-gray-800 mb-1">
            {questions.length}문제 중 <span className="text-indigo-600">{correctCount}문제</span> 정답
          </p>
          <p className="text-xs text-gray-500 mt-2">
            세션 누계: {sessionAnswered}문제 풀이 · {sessionCorrect}문제 정답
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase('result')}
            className="flex-1 py-3 text-sm border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition"
          >
            종료하기
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
          >
            계속 풀기
          </button>
        </div>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const resultData = mapSessionResultsToExamResultData(sessionResults);
    const sessionCorrectCount = sessionResults.filter(r => r.checkResult.correct).length;
    return (
      <div className="bg-gray-50 min-h-screen">
        {/* 풀이량 헤더 카드 */}
        <div className="max-w-2xl mx-auto pt-8 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {categoryName}
            </p>
            <p className="text-2xl font-bold text-indigo-600">
              {sessionResults.length}문제
            </p>
            <p className="text-sm text-gray-500">
              이번 세션 풀이 완료{' '}
              <span className="font-medium text-gray-700">· {sessionCorrectCount}문제 확인</span>
            </p>
          </div>
        </div>
        <ExamResultDisplay
          result={resultData}
          showScoreCard={false}
          onBack={() => router.push('/user/quiz')}
          backLabel="카테고리 선택"
          showSavedBanner={false}
          onRetake={handleRetake}
        />
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (!q) return null;

  const isMultipleChoice = q.questionType === 'MULTIPLE_CHOICE';
  const isOX = q.questionType === 'OX';
  const isCode = q.questionType === 'CODE';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 헤더: 카테고리 + 진행상태 + 종료 버튼 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="font-medium text-indigo-600">{categoryName}</span>
          {sessionAnswered > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              세션 {sessionAnswered}문제 · {sessionCorrect}정답
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">
            R{roundNum} · {current + 1}/{questions.length}
          </span>
          <button
            onClick={handleStop}
            className="px-3 py-1 text-xs border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 hover:border-red-300 hover:text-red-500 transition"
          >
            종료하기
          </button>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* 문제 카드 */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* 연도/회차 배지 (우측 상단) */}
        {(q.examYear != null || q.examRound != null) ? (
          <span className="absolute top-4 right-4 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
            {q.examYear != null && q.examRound != null
              ? `${q.examYear}년 ${q.examRound}회`
              : q.examYear != null
              ? `${q.examYear}년`
              : `${q.examRound}회`}
          </span>
        ) : (
          <span className="absolute top-4 right-4 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
            AI 커스텀
          </span>
        )}
        {/* 문항 관리 제목 헤더 (title이 있을 때만) */}
        {q.title && q.title.trim() !== '' && (
          <div className="pr-24 pb-3 mb-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-500 leading-tight">
              {q.title}
            </span>
          </div>
        )}

        <RichContent html={q.content} className="text-gray-800 font-medium text-base pr-24" />

        {q.code && (
          <CodeBlock code={q.code} language={q.language} />
        )}

        {/* 선택지 */}
        {isMultipleChoice && q.options && (
          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isSelected = answerState?.userAnswer === String(idx + 1);
              const correct = answerState?.result?.correct;
              const correctAnswer = answerState?.result?.answer;
              let style = 'border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50';
              if (answerState?.submitted) {
                if (isSelected && correct) style = 'border-green-400 bg-green-50 text-green-800';
                else if (isSelected && !correct) style = 'border-red-400 bg-red-50 text-red-800';
                else if (correctAnswer === String(idx + 1)) style = 'border-green-400 bg-green-50 text-green-800';
                else style = 'border-gray-200 text-gray-400';
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(opt, idx)}
                  disabled={!!answerState?.submitted || checking}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${style} disabled:cursor-default`}
                >
                  <span className="font-semibold mr-2">({idx + 1})</span>{opt}
                </button>
              );
            })}
          </div>
        )}

        {/* OX */}
        {isOX && (
          <div className="flex gap-3">
            {['O', 'X'].map(val => {
              const isSelected = answerState?.userAnswer === val;
              const correct = answerState?.result?.correct;
              const correctAnswer = answerState?.result?.answer;
              let style = 'border-gray-200 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50';
              if (answerState?.submitted) {
                if (isSelected && correct) style = 'border-green-400 bg-green-50 text-green-800';
                else if (isSelected && !correct) style = 'border-red-400 bg-red-50 text-red-800';
                else if (correctAnswer?.toUpperCase() === val) style = 'border-green-400 bg-green-50 text-green-800';
                else style = 'border-gray-200 text-gray-400';
              }
              return (
                <button
                  key={val}
                  onClick={() => handleSelectOX(val as 'O' | 'X')}
                  disabled={!!answerState?.submitted || checking}
                  className={`flex-1 py-4 rounded-xl border text-2xl font-bold transition ${style} disabled:cursor-default`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* 주관식 (단답형 · CODE) */}
        {!isMultipleChoice && !isOX && (
          <div className="space-y-2">
            {isCode ? (
              <CodeAnswerInput
                value={inputValue}
                onChange={setInputValue}
                disabled={!!answerState?.submitted}
                placeholder="코드 답안을 입력하세요"
                onCtrlEnter={handleSubmitAnswer}
              />
            ) : (
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
                placeholder="답을 입력하고 Enter 또는 정답확인 버튼을 누르세요"
                disabled={!!answerState?.submitted}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
              />
            )}
            {!answerState?.submitted && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!inputValue.trim() || checking}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {checking ? '확인 중...' : '정답확인'}
              </button>
            )}
          </div>
        )}

        {/* 결과 피드백 */}
        {answerState?.submitted && (
          <div className={[
            'rounded-xl p-4 text-sm',
            answerState.result?.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200',
          ].join(' ')}>
            <p className={`font-semibold mb-1 ${answerState.result?.correct ? 'text-green-700' : 'text-red-700'}`}>
              {answerState.result?.correct ? '정답입니다!' : '오답입니다.'}
            </p>
            {!answerState.result?.correct && (
              <p className="text-gray-700">정답: <span className="font-medium">{answerState.result?.answer}</span></p>
            )}
            {answerState.result?.explanation && (
              <p className="text-gray-600 mt-1">{answerState.result.explanation}</p>
            )}

            {/* 개념노트 + 북마크 토글 버튼 */}
            <div className="mt-3 flex justify-end gap-2">
              {/* 개념 정리 버튼 — 인디고 테마, 작성/정리 행위 */}
              <button
                onClick={() => setNoteTarget(q)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  questionNotes[q.id]
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                    : 'border-indigo-200 text-indigo-500 hover:bg-indigo-50',
                ].join(' ')}
                title="이 문제의 개념을 정리합니다"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                  className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>{questionNotes[q.id] ? '개념 정리됨' : '개념 정리'}</span>
              </button>
              {/* 복습 표시 버튼 — 앰버 테마, 나중에 다시 풀 표시 */}
              <button
                onClick={() => handleToggleBookmark(q.id)}
                disabled={togglingBookmarkId === q.id}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50',
                  bookmarkedIds.has(q.id)
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    : 'border-amber-200 text-amber-500 hover:bg-amber-50',
                ].join(' ')}
                title={bookmarkedIds.has(q.id) ? '복습 표시 해제' : '나중에 다시 풀 문제로 표시'}
              >
                {bookmarkedIds.has(q.id) ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-500">
                    <path fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                )}
                <span>{bookmarkedIds.has(q.id) ? '복습함' : '복습 표시'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 다음 버튼 */}
      {answerState?.submitted && (
        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
        >
          {current < questions.length - 1 ? '다음 문제' : '라운드 완료'}
        </button>
      )}

      {/* 개념노트 모달 (공용) — 퀴즈 문항은 questionBankId로 연결 */}
      {noteTarget && (
        <ConceptNoteModal
          key={noteTarget.id}
          defaultTitle={stripHtml(noteTarget.content).slice(0, 40)}
          existingNote={questionNotes[noteTarget.id] ?? null}
          link={{ questionBankId: noteTarget.id }}
          onClose={() => setNoteTarget(null)}
          onSaved={(note) =>
            setQuestionNotes(prev => ({ ...prev, [noteTarget.id]: note }))
          }
        />
      )}
    </div>
  );
}

// ── Page (Suspense 경계) ──────────────────────────────────────────────────────
export default function QuizPlayPage() {
  return (
    <Suspense fallback={<QuizCardSkeleton />}>
      <QuizPlayContent />
    </Suspense>
  );
}
