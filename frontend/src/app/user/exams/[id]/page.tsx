'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examService } from '@/services/examService';
import type { ExamDetail, Question } from '@/types';

const DEFAULT_MINUTES = 60;

export default function ExamTakingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const examId = Number(id);

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  // answers: questionId → 사용자 입력값
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // flagged: questionId set
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // 타이머
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timeUp, setTimeUp] = useState(false);

  // 제출 결과
  const [result, setResult] = useState<{ total: number; correct: number; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 플래그 알림 모달
  const [flagAlert, setFlagAlert] = useState(false);

  useEffect(() => {
    examService.getExamDetail(examId).then(res => {
      if (res.data.success && res.data.data) {
        setExam(res.data.data);
      }
    }).finally(() => setLoading(false));
  }, [examId]);

  // 타이머 시작
  useEffect(() => {
    if (!exam || result) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setTimeUp(true);
          return 0;
        }
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
    if (flagged.size > 0) {
      setFlagAlert(true);
      return;
    }
    if (!confirm('시험을 제출하시겠습니까?')) return;
    setSubmitting(true);
    clearInterval(timerRef.current!);
    try {
      const res = await examService.submitExam(examId, answers);
      if (res.data.success && res.data.data) {
        setResult(res.data.data as { total: number; correct: number; score: number });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-gray-400 text-sm">시험 불러오는 중...</p>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-gray-500">시험 문항이 없습니다.</p>
        <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:underline">
          돌아가기
        </button>
      </div>
    );
  }

  // ── 결과 화면 ─────────────────────────────────────────────────────────────────
  if (result) {
    const score = result.score;
    return (
      <div className="max-w-md mx-auto py-10 space-y-6 text-center">
        <div className={[
          'w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold',
          score >= 80 ? 'bg-green-100 text-green-600' :
          score >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600',
        ].join(' ')}>
          {score}점
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">시험 완료</h2>
          <p className="text-gray-500 text-sm mt-1">
            {result.total}문제 중 <span className="font-semibold text-indigo-600">{result.correct}문제</span> 정답
          </p>
        </div>
        <button
          onClick={() => router.push('/user/exams')}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          시험 목록으로
        </button>
      </div>
    );
  }

  // ── 시간 초과 ────────────────────────────────────────────────────────────────
  if (timeUp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
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
              const res = await examService.submitExam(examId, answers);
              if (res.data.success && res.data.data) {
                setResult(res.data.data as { total: number; correct: number; score: number });
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

  // ── 플래그 알림 모달 ─────────────────────────────────────────────────────────
  const flagAlertModal = flagAlert && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <h3 className="font-bold text-gray-900">체크된 문항이 있습니다</h3>
        <p className="text-sm text-gray-600">아래 문항을 다시 확인해 주세요.</p>
        <div className="flex flex-wrap gap-2">
          {Array.from(flagged).map(qId => {
            const idx = questions.findIndex(q => q.id === qId);
            return (
              <button
                key={qId}
                onClick={() => { setCurrent(idx); setFlagAlert(false); }}
                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition"
              >
                {idx + 1}번
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setFlagAlert(false)}
          className="w-full py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition"
        >
          닫기
        </button>
      </div>
    </div>
  );

  // ── 시험 본 화면 (2패널) ─────────────────────────────────────────────────────
  const isMultiple = q.questionType === 'MULTIPLE_CHOICE';
  const isOX = q.questionType === 'OX';
  const isFlagged = flagged.has(q.id);

  return (
    <>
      {flagAlertModal}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-8rem)]">
        {/* ── 왼쪽: 문제 영역 ── */}
        <div className="flex-1 flex flex-col gap-4">
          {/* 시험 제목 */}
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center justify-between">
            <h1 className="font-semibold text-gray-900 text-base truncate">{exam.title}</h1>
            <span className="text-xs text-gray-400 shrink-0 ml-2">
              {current + 1} / {questions.length}
            </span>
          </div>

          {/* 문제 카드 */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
            {/* 체크 버튼 + 번호 */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-indigo-600">Q{current + 1}.</span>
              <button
                onClick={() => toggleFlag(q.id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition',
                  isFlagged
                    ? 'bg-amber-100 border-amber-400 text-amber-700'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-amber-400 hover:text-amber-600',
                ].join(' ')}
              >
                <svg viewBox="0 0 24 24" fill={isFlagged ? 'currentColor' : 'none'}
                  stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 21V5a2 2 0 012-2h9.172a2 2 0 011.414.586l2.828 2.828A2 2 0 0119 7.828V21M3 21h16M3 21l2-4h12l2 4" />
                </svg>
                {isFlagged ? '체크됨' : '나중에 확인'}
              </button>
            </div>

            <p className="text-gray-800 text-sm leading-relaxed">{q.content}</p>

            {/* 선택지 */}
            {isMultiple && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, idx) => {
                  const val = String(idx + 1);
                  const selected = answers[q.id] === val;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(q.id, val)}
                      className={[
                        'w-full text-left px-4 py-3 rounded-xl border text-sm transition',
                        selected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-800 font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50',
                      ].join(' ')}
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
                {['O', 'X'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleAnswer(q.id, val)}
                    className={[
                      'flex-1 py-5 rounded-xl border text-2xl font-bold transition',
                      answers[q.id] === val
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:border-indigo-300',
                    ].join(' ')}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}

            {/* 주관식 */}
            {!isMultiple && !isOX && (
              <input
                value={answers[q.id] ?? ''}
                onChange={e => handleAnswer(q.id, e.target.value)}
                placeholder="답을 입력하세요"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            )}

            {/* 이전/다음 버튼 */}
            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
              <button
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                이전
              </button>
              <button
                onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                disabled={current === questions.length - 1}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 transition"
              >
                다음
              </button>
            </div>
          </div>
        </div>

        {/* ── 오른쪽: 답안지 영역 ── */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
          {/* 타이머 */}
          <div className={[
            'bg-white rounded-xl border p-5 text-center',
            secondsLeft <= 300 ? 'border-red-300' : 'border-gray-200',
          ].join(' ')}>
            <p className="text-xs text-gray-500 mb-1">남은 시간</p>
            <p className={[
              'text-3xl font-bold font-mono',
              secondsLeft <= 300 ? 'text-red-500' : 'text-gray-900',
            ].join(' ')}>
              {formatTime(secondsLeft)}
            </p>
          </div>

          {/* 답안 현황 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1">
            <p className="text-xs font-semibold text-gray-500 mb-3">답안 현황</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((question, idx) => {
                const isAnswered = !!answers[question.id];
                const isCurrentQ = idx === current;
                const isFlaggedQ = flagged.has(question.id);
                return (
                  <button
                    key={question.id}
                    onClick={() => setCurrent(idx)}
                    title={`${idx + 1}번${isFlaggedQ ? ' (체크됨)' : ''}`}
                    className={[
                      'aspect-square rounded-lg text-xs font-medium transition relative',
                      isCurrentQ
                        ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white'
                        : isFlaggedQ
                        ? 'bg-amber-100 text-amber-700 border border-amber-400'
                        : isAnswered
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:border-indigo-300',
                    ].join(' ')}
                  >
                    {idx + 1}
                    {isFlaggedQ && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1.5 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200 shrink-0" />
                답변 완료 ({Object.keys(answers).length}/{questions.length})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 shrink-0" />
                체크 ({flagged.size}개)
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? '채점 중...' : '시험 제출'}
          </button>
        </div>
      </div>
    </>
  );
}
