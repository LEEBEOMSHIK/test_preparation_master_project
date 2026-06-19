'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conceptNoteService } from '@/services/conceptNoteService';
import { Skeleton } from '@/components/ui/Skeleton';
import { RichContent } from '@/components/ui/RichContent';
import { LinkedQuestionBox } from '@/components/ui/LinkedQuestionBox';
import type { ConceptNote } from '@/types';

export default function ConceptExploreDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<ConceptNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conceptNoteService.getPublicNote(Number(id))
      .then(res => {
        const data = res.data.data;
        if (data) setNote(data);
      })
      .catch(() => {
        router.replace('/user/concepts/explore');
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/user/concepts/explore')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 탐색 목록으로
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3 rounded-lg" />
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : !note ? null : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          {/* 제목 + 공개뱃지 */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-gray-800 flex-1">{note.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-50 text-green-600 border border-green-200">
              공개
            </span>
          </div>

          {/* 작성자 + 수정일 */}
          <div className="text-xs text-gray-400 mb-5 space-y-0.5">
            <div>작성자: {note.userName}</div>
            <div>최종 수정: {new Date(note.updatedAt).toLocaleString('ko-KR')}</div>
          </div>

          {/* 연결된 문제 박스 */}
          <LinkedQuestionBox note={note} />

          {/* 본문 */}
          <div className="border-t border-gray-100 pt-5">
            <RichContent html={note.content} className="prose prose-sm max-w-none text-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}
