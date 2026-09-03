'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { InquiryTimeline } from '@/components/ui/InquiryTimeline';
import { InquiryMessageComposer } from '@/components/ui/InquiryMessageComposer';
import { Skeleton } from '@/components/ui/Skeleton';
import { extractApiErrorMessage } from '@/lib/apiError';
import { loadInquiryDomainOptions } from '@/lib/inquiryDomain';
import {
  getInquiryTargetAreaLabel,
  INQUIRY_REQUEST_TYPES,
  INQUIRY_TARGET_AREAS,
  isInquiryClosed,
  isInquiryRequestType,
  isInquiryTargetArea,
  requiresTargetArea,
  usesTargetArea,
} from '@/lib/inquiry';
import { inquiryService } from '@/services/inquiryService';
import type { Inquiry, InquiryRequestType, InquiryTargetArea } from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

function withCurrentOption<T extends string>(options: T[], current: T): T[] {
  return options.includes(current) ? options : [current, ...options];
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editType, setEditType] = useState<InquiryRequestType>('GENERAL_INQUIRY');
  const [editTargetArea, setEditTargetArea] = useState<InquiryTargetArea | ''>('');
  const [editDetailLocation, setEditDetailLocation] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editTypes, setEditTypes] = useState<InquiryRequestType[]>(INQUIRY_REQUEST_TYPES);
  const [editAreas, setEditAreas] = useState<InquiryTargetArea[]>(INQUIRY_TARGET_AREAS);
  const [editDomainsLoading, setEditDomainsLoading] = useState(false);
  const [unavailableEditType, setUnavailableEditType] = useState<InquiryRequestType | null>(null);
  const [unavailableEditArea, setUnavailableEditArea] = useState<InquiryTargetArea | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    inquiryService
      .getMyInquiry(Number(id))
      .then((response) => setInquiry(response.data.data ?? null))
      .catch(() => setError('문의·요청을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (!inquiry) {
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        {error || '문의·요청을 찾을 수 없습니다.'}
      </div>
    );
  }

  const closed = isInquiryClosed(inquiry.status);
  const editable = inquiry.status === 'PENDING' && inquiry.messages.length === 0;
  const editDisabledReason = inquiry.status !== 'PENDING'
    ? '접수 대기 상태의 문의만 수정할 수 있습니다.'
    : '후속 메시지가 등록된 문의는 수정할 수 없습니다.';

  const startEditing = () => {
    setEditDomainsLoading(true);
    void Promise.all([
      loadInquiryDomainOptions('INQUIRY_CATEGORY', isInquiryRequestType, INQUIRY_REQUEST_TYPES),
      loadInquiryDomainOptions('INQUIRY_BUG_AREA', isInquiryTargetArea, INQUIRY_TARGET_AREAS),
    ]).then(([types, areas]) => {
      setEditTypes(withCurrentOption(types, inquiry.requestType));
      setEditAreas(inquiry.targetArea ? withCurrentOption(areas, inquiry.targetArea) : areas);
      setEditType(inquiry.requestType);
      setEditTargetArea(inquiry.targetArea ?? '');
      setUnavailableEditType(types.includes(inquiry.requestType) ? null : inquiry.requestType);
      setUnavailableEditArea(inquiry.targetArea && !areas.includes(inquiry.targetArea) ? inquiry.targetArea : null);
    }).finally(() => setEditDomainsLoading(false));
    setEditDetailLocation(inquiry.detailLocation ?? '');
    setEditTitle(inquiry.title);
    setEditContent(inquiry.content);
    setEditError('');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (saving) return;
    if (!editTitle.trim() || !editContent.trim()) {
      setEditError('제목과 내용을 입력해 주세요.');
      return;
    }
    if (requiresTargetArea(editType) && !editTargetArea) {
      setEditError('버그 발생 영역을 선택해 주세요.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await inquiryService.update(inquiry.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        requestType: editType,
        ...(usesTargetArea(editType) && editTargetArea ? { targetArea: editTargetArea } : {}),
        ...(editType !== 'EXAM_OPENING_REQUEST' && editDetailLocation.trim()
          ? { detailLocation: editDetailLocation.trim() }
          : {}),
      });
      setEditing(false);
      load();
    } catch (updateError) {
      setEditError(extractApiErrorMessage(updateError, '문의 수정에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/user/inquiries" className="text-sm text-gray-500">← 목록</Link>
        <span className="text-xs text-gray-500">{INQUIRY_STATUS_LABEL[inquiry.status]}</span>
      </div>
      <header className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xs text-indigo-600 dark:text-indigo-400">
          {INQUIRY_TYPE_LABEL[inquiry.requestType]}
          {inquiry.targetArea ? ` · ${getInquiryTargetAreaLabel(inquiry.targetArea)}` : ''}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {inquiry.title}
        </h2>
        {inquiry.detailLocation && (
          <p className="mt-2 text-xs text-gray-500">상세 위치: {inquiry.detailLocation}</p>
        )}
        <div className="mt-4">
          <button
            type="button"
            disabled={!editable}
            onClick={startEditing}
            title={!editable ? editDisabledReason : undefined}
            className="rounded-lg border border-indigo-600 px-3 py-2 text-sm text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-300"
          >
            문의 수정
          </button>
          {!editable && <p className="mt-2 text-xs text-gray-500">{editDisabledReason}</p>}
        </div>
      </header>
      {editing && (
        <section className="space-y-4 rounded-xl border border-indigo-200 bg-white p-5 dark:border-indigo-900 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">문의 수정</h3>
          <label className="block text-sm">접수 유형
            <select value={editType} onChange={(event) => {
              const value = event.target.value;
              if (isInquiryRequestType(value)) setEditType(value);
              setEditTargetArea('');
            }} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800">
              {editTypes.map((item) => <option key={item} value={item}>{INQUIRY_TYPE_LABEL[item]}{item === unavailableEditType ? ' (현재 설정)' : ''}</option>)}
            </select>
          </label>
          {usesTargetArea(editType) && <label className="block text-sm">발생 영역 {requiresTargetArea(editType) && <span className="text-red-500">*</span>}
            <select value={editTargetArea} onChange={(event) => {
              const value = event.target.value;
              setEditTargetArea(isInquiryTargetArea(value) ? value : '');
            }} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800">
              <option value="">선택하세요</option>
              {editAreas.map((area) => <option key={area} value={area}>{getInquiryTargetAreaLabel(area)}{area === unavailableEditArea ? ' (현재 설정)' : ''}</option>)}
            </select>
          </label>}
          {editType !== 'EXAM_OPENING_REQUEST' && <label className="block text-sm">상세 위치/URL
            <input value={editDetailLocation} maxLength={500} onChange={(event) => setEditDetailLocation(event.target.value)} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800" />
          </label>}
          <label className="block text-sm">제목
            <input value={editTitle} maxLength={200} onChange={(event) => setEditTitle(event.target.value)} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800" />
          </label>
          <label className="block text-sm">내용
            <textarea value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={7} className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800" />
          </label>
          <p className="text-xs text-gray-500">기존 첨부 이미지는 유지됩니다.</p>
          {editError && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{editError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm">취소</button>
            <button type="button" onClick={() => void saveEdit()} disabled={saving || editDomainsLoading || editTypes.length === 0} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving || editDomainsLoading ? '저장 중...' : '수정 저장'}</button>
          </div>
        </section>
      )}
      <InquiryTimeline inquiry={inquiry} />
      {closed ? (
        <p className="rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          처리가 종료되었습니다.
        </p>
      ) : (
        !editable && <InquiryMessageComposer inquiryId={inquiry.id} onSent={load} />
      )}
    </div>
  );
}
