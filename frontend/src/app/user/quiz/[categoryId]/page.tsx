'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { quizService, type QuizQuestion, type CheckResult } from '@/services/quizService';

type Phase = 'loading' | 'quiz' | 'result';

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

  useEffect(() => {
    quizService.getQuestions(categoryId, 10).then(res => {
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setQuestions(res.data.data);
        setPhase('quiz');
      } else {
        alert('이 카테고리에 등록된 문항이 없습니다.');
        router.back();
      }
    });
  }, [categoryId]);

  const q = questions[current];
  const answerState = q ? answers[q.id] : undefined;

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

  const handleSelectOption = useCallback(async (option: string, idx: number) => {
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

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setInputValue('');
    } else {
      setPhase('result');
    }
  };

  const correctCount = Object.values(answers).filter(a => a.result?.correct).length;
  const answeredCount = Object.values(answers).filter(a => a.submitted).length;

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400 text-sm">문제를 불러오는 중...</p>
      </div>
    );
  }

  if (phase === 'result') {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
          <div className={[
            'w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-bold mb-4',
            score >= 80 ? 'bg-green-100 text-green-600' :
            score >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600',
          ].join(' ')}>
            {score}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">퀴즈 완료!</h2>
          <p className="text-gray-500 text-sm mb-4">
            {questions.length}문제 중 <span className="font-semibold text-indigo-600">{correctCount}문제</span> 정답
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
                setAnswers({});
                setCurrent(0);
                setInputValue('');
                setPhase('loading');
                quizService.getQuestions(categoryId, 10).then(res => {
                  if (res.data.success && res.data.data) {
                    setQuestions(res.data.data);
                    setPhase('quiz');
                  }
                });
              }}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              다시 풀기
            </button>
          </div>
        </div>

        {/* 오답 복습 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">문제 리뷰</h3>
          {questions.map((question, idx) => {
            const ans = answers[question.id];
            return (
              <div
                key={question.id}
                className={[
                  'bg-white rounded-xl border p-4 text-sm',
                  ans?.result?.correct ? 'border-green-200' : 'border-red-200',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  <span className={[
                    'shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                    ans?.result?.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600',
                  ].join(' ')}>
                    {ans?.result?.correct ? '○' : '×'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium mb-1">Q{idx + 1}. {question.content}</p>
                    {!ans?.result?.correct && (
                      <p className="text-green-700 text-xs">정답: {ans?.result?.answer}</p>
                    )}
                    {ans?.result?.explanation && (
                      <p className="text-gray-500 text-xs mt-1">{ans.result.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!q) return null;

  const isMultipleChoice = q.questionType === 'MULTIPLE_CHOICE';
  const isOX = q.questionType === 'OX';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* 진행 상태 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="font-medium text-indigo-600">{categoryName}</span>
        <span>{current + 1} / {questions.length}</span>
      </div>
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
          {current < questions.length - 1 ? '다음 문제' : '결과 보기'}
        </button>
      )}
    </div>
  );
}
