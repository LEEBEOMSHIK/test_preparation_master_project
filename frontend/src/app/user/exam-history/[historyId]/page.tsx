'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examinationService } from '@/services/examinationService';
import { QuizCardSkeleton } from '@/components/ui/Skeleton';
import { ExamResultDisplay } from '@/components/ui/ExamResultDisplay';
import type { ExamResultData } from '@/types';

export default function ExamHistoryDetailPage() {
  const { historyId } = useParams<{ historyId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examinationService
      .userGetHistoryResult(Number(historyId))
      .then(res => {
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          setResult({
            total: d.total,
            correct: d.correct,
            score: d.score,
            results: d.results,
            historyId: d.historyId,
            takenAt: d.takenAt,
          });
        } else {
          router.replace('/user/exam-history');
        }
      })
      .catch(() => {
        router.replace('/user/exam-history');
      })
      .finally(() => setLoading(false));
  }, [historyId, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <QuizCardSkeleton />
      </div>
    );
  }

  if (!result) return null;

  return (
    <ExamResultDisplay
      result={result}
      onBack={() => router.push('/user/exam-history')}
      backLabel="이력 목록으로"
    />
  );
}
