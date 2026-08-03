'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conceptNoteService } from '@/services/conceptNoteService';
import { Skeleton } from '@/components/ui/Skeleton';
import { RichContent } from '@/components/ui/RichContent';
import { LinkedQuestionBox } from '@/components/ui/LinkedQuestionBox';
import { ScratchPadPanel } from '@/components/ui/ScratchPadPanel';
import { BugReportModal, type BugReportContext } from '@/components/ui/BugReportModal';
import type { ConceptNote } from '@/types';

/** 노트에 연결된 시험·퀴즈 문항이 있으면 그 내용을, 없으면 노트 본문을 신고 컨텍스트로 사용 */
function toBugReportContext(note: ConceptNote): BugReportContext {
  return {
    source: 'CONCEPT_NOTE',
    label: note.title,
    questionId: note.questionId ?? note.questionBankId,
    questionContent: note.questionContent ?? note.questionBankContent ?? note.content,
  };
}

export default function ConceptExploreDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<ConceptNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBugReport, setShowBugReport] = useState(false);

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
          {/* 제목 + 공개뱃지 + 버그 신고 */}
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-gray-800 flex-1">{note.title}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-green-50 text-green-600 border border-green-200">
              공개
            </span>
            <button
              onClick={() => setShowBugReport(true)}
              title="이 노트에 오류가 있나요? 버그 신고"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
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

      {/* 풀이 스크래치패드 — 내 노트 상세와 같은 노트 단위 키 공유 (같은 노트면 어느 화면에서든 같은 메모) */}
      {note && <ScratchPadPanel storageKey={`tpmp_scratchpad:concept:${id}`} />}

      {/* 버그 신고 모달 */}
      {showBugReport && note && (
        <BugReportModal context={toBugReportContext(note)} onClose={() => setShowBugReport(false)} />
      )}
    </div>
  );
}
