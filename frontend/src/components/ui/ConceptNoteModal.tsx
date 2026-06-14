'use client';

import { useState } from 'react';
import { conceptNoteService } from '@/services/conceptNoteService';
import type { ConceptNote } from '@/types';

/** 노트가 연결될 문항 식별 — 시험은 questionId, 데일리 퀴즈는 questionBankId */
export type ConceptNoteLink = { questionId: number } | { questionBankId: number };

interface Props {
  /** 신규 작성 시 채워질 기본 제목 */
  defaultTitle: string;
  /** 기존에 이 문항으로 저장된 노트(있으면 수정 모드) */
  existingNote?: ConceptNote | null;
  /** 노트를 연결할 문항 식별자 */
  link: ConceptNoteLink;
  onClose: () => void;
  onSaved: (note: ConceptNote) => void;
}

/**
 * 문항별 개념노트 작성/수정 모달 (시험 응시·데일리 퀴즈 공용)
 * - link로 questionId(시험) 또는 questionBankId(퀴즈)를 받아 연결한다.
 * - 부모는 대상 문항이 바뀔 때 key로 remount하여 초기값을 갱신한다.
 */
export function ConceptNoteModal({ defaultTitle, existingNote, link, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(existingNote?.title ?? defaultTitle);
  const [content, setContent] = useState(existingNote?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || saving || saved) return;
    setSaving(true);
    try {
      const payload = { title: title.trim(), content: content.trim(), isPublic: false, ...link };
      const res = existingNote
        ? await conceptNoteService.update(existingNote.id, payload)
        : await conceptNoteService.create(payload);
      if (res.data.data) {
        onSaved(res.data.data);
        setSaved(true);
        setTimeout(onClose, 800);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 text-indigo-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            {existingNote ? '개념노트 수정' : '개념노트 작성'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="이 문제에서 기억할 개념을 메모하세요..."
          rows={6}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim() || saved}
            className={[
              'px-4 py-2 text-sm rounded-lg font-medium transition',
              saved
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50',
            ].join(' ')}>
            {saved ? '저장됨 ✓' : saving ? '저장 중...' : existingNote ? '수정' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
