'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conceptNoteService } from '@/services/conceptNoteService';
import { notionService, type NotionStatus } from '@/services/notionService';
import { LinkedQuestionBox } from '@/components/ui/LinkedQuestionBox';
import { ScratchPadPanel } from '@/components/ui/ScratchPadPanel';
import { BugReportModal, type BugReportContext } from '@/components/ui/BugReportModal';
import { Skeleton } from '@/components/ui/Skeleton';
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

export default function ConceptNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [note, setNote] = useState<ConceptNote | null>(null);
  const [editing, setEditing] = useState(isNew);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 신규 작성 시 기본값 비공개, 기존 노트 수정 시 서버값으로 덮어씌워짐
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Notion 연동
  const [notion, setNotion] = useState<NotionStatus | null>(null);
  const [exporting, setExporting] = useState(false);

  // 버그 신고 모달 표시 여부
  const [showBugReport, setShowBugReport] = useState(false);

  useEffect(() => {
    if (isNew) return;
    conceptNoteService.getMyNote(Number(id))
      .then(res => {
        const data = res.data.data;
        if (data) {
          setNote(data);
          setTitle(data.title);
          setContent(data.content);
          setIsPublic(data.isPublic);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isNew]);

  useEffect(() => {
    if (isNew) return;
    notionService.getStatus()
      .then(res => { if (res.data.data) setNotion(res.data.data); })
      .catch(() => setNotion(null));
  }, [isNew]);

  async function handleExportNotion() {
    setExporting(true);
    try {
      const res = await notionService.exportNote(Number(id));
      const url = res.data.data?.url;
      if (url && confirm('Notion으로 내보냈습니다. 페이지를 열어볼까요?')) window.open(url, '_blank');
    } catch {
      alert('Notion 내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  }

  function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    const req = { title: title.trim(), content: content.trim(), isPublic };
    const call = isNew
      ? conceptNoteService.create(req)
      : conceptNoteService.update(Number(id), req);

    call
      .then(() => router.push('/user/concepts'))
      .finally(() => setSaving(false));
  }

  function handleDelete() {
    if (!confirm('개념노트를 삭제하시겠습니까?')) return;
    conceptNoteService.delete(Number(id)).then(() => router.push('/user/concepts'));
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/user/concepts')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← 목록으로
        </button>
        {!isNew && !editing && (
          <div className="flex gap-2">
            {note && (
              <button
                onClick={() => setShowBugReport(true)}
                title="이 노트에 오류가 있나요? 버그 신고"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            {notion?.connected && (
              <button
                onClick={handleExportNotion}
                disabled={exporting}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
              >
                {exporting ? '내보내는 중…' : '노션으로 내보내기'}
              </button>
            )}
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 text-sm border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm border border-red-200 text-red-500 rounded-lg hover:bg-red-50"
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {editing ? (
        /* Edit / Create form */
        <div className="space-y-4">
          {/* 편집 모드에서도 연결 문제 표시 (읽기 전용) */}
          {note && <LinkedQuestionBox note={note} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="개념노트 제목"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              rows={16}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="개념 설명을 작성하세요..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">공개</label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            {!isNew && (
              <button
                onClick={() => { setEditing(false); setTitle(note!.title); setContent(note!.content); setIsPublic(note!.isPublic); }}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : isNew ? '작성 완료' : '수정 완료'}
            </button>
          </div>
        </div>
      ) : (
        /* View mode */
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-gray-800 flex-1">{note?.title}</h1>
            {note?.questionId && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0">시험문제</span>
            )}
            {note?.questionBankId && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 shrink-0">퀴즈문제</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
              note?.isPublic
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
              {note?.isPublic ? '공개' : '비공개'}
            </span>
          </div>

          <div className="text-xs text-gray-400 mb-5">
            최종 수정: {note && new Date(note.updatedAt).toLocaleString('ko-KR')}
          </div>

          {/* 연결된 문제 박스 */}
          {note && <LinkedQuestionBox note={note} />}

          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap break-words leading-relaxed border-t border-gray-100 pt-5">
            {note?.content}
          </div>
        </div>
      )}

      {/* 풀이 스크래치패드 — 노트 단위 localStorage 저장 (신규 작성 화면은 id가 'new'라 노트 간 섞이므로 제외) */}
      {!isNew && <ScratchPadPanel storageKey={`tpmp_scratchpad:concept:${id}`} />}

      {/* 버그 신고 모달 */}
      {showBugReport && note && (
        <BugReportModal context={toBugReportContext(note)} onClose={() => setShowBugReport(false)} />
      )}
    </div>
  );
}
