'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { inquiryService } from '@/services/inquiryService';
import type { InquiryType } from '@/types';
import { INQUIRY_TYPE_LABEL } from '@/types';

const INQUIRY_TYPES: InquiryType[] = ['EXAM', 'CONCEPT_NOTE', 'DAILY_QUIZ', 'OTHER'];

export default function NewInquiryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [inquiryType, setInquiryType] = useState<InquiryType>('OTHER');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrls.length >= 3) {
      setError('이미지는 최대 3개까지 첨부할 수 있습니다.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const res = await inquiryService.uploadImage(file);
      if (res.data.success && res.data.data?.url) {
        setImageUrls((prev) => [...prev, res.data.data!.url]);
      }
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('제목을 입력해 주세요.'); return; }
    if (!content.trim()) { setError('문의 내용을 입력해 주세요.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await inquiryService.create({ title: title.trim(), content: content.trim(), inquiryType, imageUrls });
      router.push('/user/inquiries');
    } catch {
      setError('문의 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/user/inquiries" className="text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">문의 등록</h2>
          <p className="text-sm text-gray-500 mt-0.5">궁금한 점이나 불편사항을 알려주세요.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* 문의 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            문의 유형 <span className="text-red-500">*</span>
          </label>
          <select
            value={inquiryType}
            onChange={(e) => setInquiryType(e.target.value as InquiryType)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {INQUIRY_TYPES.map((t) => (
              <option key={t} value={t}>{INQUIRY_TYPE_LABEL[t]}</option>
            ))}
          </select>
        </div>

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="문의 제목을 입력하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400 text-right">{title.length}/200</p>
        </div>

        {/* 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            문의 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="문의 내용을 자세히 입력해 주세요."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        {/* 이미지 첨부 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            이미지 첨부 <span className="text-gray-400 font-normal">(최대 3개)</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`첨부 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-black/50 text-white text-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {imageUrls.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-xs gap-1 disabled:opacity-50"
              >
                {uploading ? (
                  <span>업로드 중</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>추가</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          <p className="mt-1 text-xs text-gray-400">JPG, PNG, GIF, WEBP 파일 업로드 가능</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/user/inquiries"
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? '등록 중...' : '문의 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
