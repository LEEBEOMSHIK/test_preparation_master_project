'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { quizService, type QuizQuestion, type CheckResult } from '@/services/quizService';

type Phase = 'loading' | 'quiz' | 'continue' | 'result';

interface AnswerState {
  userAnswer: string;
  submitted: boolean;
  result?: CheckResult;
}

export default function QuizPlayPage() {
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
        router.back();
      }
    });
  }, [categoryId, router]);

  useEffect(() => {
    loadBatch();
  }, [categoryId]);

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
      }
    } finally {
      setChecking(false);
    }
  }, [q, answerState]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">문제를 불러오는 중...</p>
      </div>
    );
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
    const totalAnswered = sessionAnswered;
    const totalCorrect = sessionCorrect;
    const score = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          <div className={[
            'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4',
            score >= 80 ? 'bg-green-100 text-green-600'
            : score >= 50 ? 'bg-yellow-100 text-yellow-600'
            : 'bg-red-100 text-red-600',
          ].join(' ')}>
            {score}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">세션 종료</h2>
          <p className="text-gray-500 text-sm mb-1">
            총 <span className="font-semibold text-gray-800">{totalAnswered}</span>문제 중{' '}
            <span className="font-semibold text-indigo-600">{totalCorrect}문제</span> 정답
          </p>
          <p className="text-xs text-gray-400 mb-5">
            {roundNum - (phase === 'result' ? 0 : 1)}라운드 진행
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/user/quiz')}
              className="px-5 py-2 text-sm border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              카테고리 선택
            </button>
            <button
              onClick={() => {
                setSessionAnswered(0);
                setSessionCorrect(0);
                setRoundNum(1);
                loadBatch();
              }}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              다시 시작
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  if (!q) return null;

  const isMultipleChoice = q.questionType === 'MULTIPLE_CHOICE';
  const isOX = q.questionType === 'OX';

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
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        <p className="text-gray-800 font-medium text-base leading-relaxed">{q.content}</p>

        {q.code && (
          <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto">
            {q.code}
          </pre>
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
                  onClick={async () => {
                    if (answerState?.submitted) return;
                    setChecking(true);
                    try {
                      const res = await quizService.checkAnswer(q.id, val);
                      if (res.data.success && res.data.data) {
                        setAnswers(prev => ({
                          ...prev,
                          [q.id]: { userAnswer: val, submitted: true, result: res.data.data! },
                        }));
                      }
                    } finally { setChecking(false); }
                  }}
                  disabled={!!answerState?.submitted || checking}
                  className={`flex-1 py-4 rounded-xl border text-2xl font-bold transition ${style} disabled:cursor-default`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        )}

        {/* 주관식 */}
        {!isMultipleChoice && !isOX && (
          <div className="space-y-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitAnswer()}
              placeholder="답을 입력하고 Enter 또는 제출 버튼을 누르세요"
              disabled={!!answerState?.submitted}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
            />
            {!answerState?.submitted && (
              <button
                onClick={handleSubmitAnswer}
                disabled={!inputValue.trim() || checking}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {checking ? '확인 중...' : '제출'}
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
    </div>
  );
}
