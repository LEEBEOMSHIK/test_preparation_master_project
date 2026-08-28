'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  getInquiryTargetAreaLabel,
  INQUIRY_REQUEST_TYPES,
  INQUIRY_TARGET_AREAS,
  isInquiryRequestType,
  isInquiryTargetArea,
  requiresTargetArea,
  usesTargetArea,
} from '@/lib/inquiry';
import { domainService } from '@/services/domainService';
import { inquiryService, type UploadImageResult } from '@/services/inquiryService';
import type { InquiryRequestType, InquiryTargetArea } from '@/types';
import { INQUIRY_TYPE_LABEL } from '@/types';

async function loadDomainOptions<T extends string>(
  code: string,
  isAllowed: (value: string) => value is T,
  fallback: T[],
): Promise<T[]> {
  try {
    const response = await domainService.getSlavesByCode(code);
    const options = (response.data.data ?? [])
      .map((item) => item.name)
      .filter(isAllowed);
    return options;
  } catch {
    return fallback;
  }
}

export default function NewInquiryPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<InquiryRequestType>('GENERAL_INQUIRY');
  const [types, setTypes] = useState<InquiryRequestType[]>(INQUIRY_REQUEST_TYPES);
  const [areas, setAreas] = useState<InquiryTargetArea[]>(INQUIRY_TARGET_AREAS);
  const [domainsLoading, setDomainsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetArea, setTargetArea] = useState<InquiryTargetArea | ''>('');
  const [detailLocation, setDetailLocation] = useState('');
  const [images, setImages] = useState<UploadImageResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      loadDomainOptions('INQUIRY_CATEGORY', isInquiryRequestType, INQUIRY_REQUEST_TYPES),
      loadDomainOptions('INQUIRY_BUG_AREA', isInquiryTargetArea, INQUIRY_TARGET_AREAS),
    ])
      .then(([loadedTypes, loadedAreas]) => {
        setTypes(loadedTypes);
        setAreas(loadedAreas);
        setType((current) => (
          loadedTypes.includes(current) ? current : (loadedTypes[0] ?? current)
        ));
        setTargetArea((current) => current && !loadedAreas.includes(current) ? '' : current);
      })
      .finally(() => setDomainsLoading(false));
  }, []);

  const upload = async (file?: File) => {
    if (!file || images.length === 3) return;
    try {
      const response = await inquiryService.uploadImage(file);
      if (response.data.data) {
        setImages((current) => [...current, response.data.data!]);
      }
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해 주세요.');
      return;
    }
    if (requiresTargetArea(type) && !targetArea) {
      setError('버그 발생 영역을 선택해 주세요.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await inquiryService.create({
        title: title.trim(),
        content: content.trim(),
        requestType: type,
        ...(usesTargetArea(type) && targetArea ? { targetArea } : {}),
        ...(type !== 'EXAM_OPENING_REQUEST' && detailLocation.trim()
          ? { detailLocation: detailLocation.trim() }
          : {}),
        attachmentIds: images.map((image) => image.id),
      });
      router.push('/user/inquiries');
    } catch {
      setError('문의·요청 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link href="/user/inquiries" className="text-sm text-gray-500">← 목록</Link>
        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          문의·요청 등록
        </h2>
      </div>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        {domainsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <label className="block text-sm">
              접수 유형
              <select
                value={type}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isInquiryRequestType(value)) setType(value);
                  setTargetArea('');
                }}
                className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800"
              >
                {types.map((item) => (
                  <option key={item} value={item}>{INQUIRY_TYPE_LABEL[item]}</option>
                ))}
              </select>
            </label>

            {usesTargetArea(type) && (
              <label className="block text-sm">
                발생 영역 {requiresTargetArea(type) && <span className="text-red-500">*</span>}
                <select
                  value={targetArea}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTargetArea(isInquiryTargetArea(value) ? value : '');
                  }}
                  className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800"
                >
                  <option value="">선택하세요</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>{getInquiryTargetAreaLabel(area)}</option>
                  ))}
                </select>
              </label>
            )}
          </>
        )}

        {type !== 'EXAM_OPENING_REQUEST' && (
          <label className="block text-sm">
            상세 위치/URL
            <input
              value={detailLocation}
              maxLength={500}
              onChange={(event) => setDetailLocation(event.target.value)}
              className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800"
            />
            <span className="text-xs text-gray-400">{detailLocation.length}/500</span>
          </label>
        )}

        <label className="block text-sm">
          제목
          <input
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800"
          />
        </label>
        <label className="block text-sm">
          내용
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={7}
            className="mt-1 w-full rounded-lg border p-2 dark:bg-gray-800"
          />
        </label>

        <div className="flex items-center gap-2">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}
              className="text-xs text-indigo-600"
            >
              이미지 ×
            </button>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm text-gray-500"
          >
            이미지 첨부 ({images.length}/3)
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || domainsLoading || types.length === 0}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </section>
    </div>
  );
}
