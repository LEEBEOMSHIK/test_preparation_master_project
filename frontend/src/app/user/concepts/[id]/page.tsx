'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { conceptNoteService } from '@/services/conceptNoteService';
import type { ConceptNote } from '@/types';

function QuestionContent({ content }: { content: string }) {
  if (content.includes('<img')) {
    return (
      <div
        className="text-sm text-gray-700 leading-relaxed [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2 [&_img]:block"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>;
}

function CodeBlock({ code, language }: { code: string; language?: string | null }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[#3c3f41] text-left mt-3">
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

function LinkedQuestionBox({ note }: { note: ConceptNote }) {
  const content = note.questionContent || note.questionBankContent;
  const code = note.questionCode || note.questionBankCode;
  const language = note.questionLanguage || note.questionBankLanguage;
  const source = note.questionId ? '시험문제' : note.questionBankId ? '퀴즈문제' : null;
  if (!content || !source) return null;

  return (
    <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium text-indigo-500 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
          {source}
        </span>
        <span className="text-xs text-indigo-400">이 문제에서 작성된 개념노트</span>
      </div>
      <QuestionContent content={content} />
      {code && <CodeBlock code={code} language={language} />}
    </div>
  );
}

export default function ConceptNoteDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const [note, setNote] = useState<ConceptNote | null>(null);
  const [editing, setEditing] = useState(isNew);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

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
    return <div className="p-6 text-center text-gray-400">로딩 중...</div>;
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

          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed border-t border-gray-100 pt-5">
            {note?.content}
          </div>
        </div>
      )}
    </div>
  );
}
