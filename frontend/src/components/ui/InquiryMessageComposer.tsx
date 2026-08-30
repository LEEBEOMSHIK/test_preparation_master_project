'use client';

import { useState } from 'react';
import { ApiApplicationError, extractApiErrorMessage } from '@/lib/apiError';
import { inquiryService } from '@/services/inquiryService';
import { InquiryImageUploader, type InquiryUploadedImage } from './InquiryImageUploader';

interface InquiryMessageComposerProps {
  inquiryId: number;
  onSent: () => void;
  admin?: boolean;
}

export function InquiryMessageComposer({
  inquiryId,
  onSent,
  admin = false,
}: InquiryMessageComposerProps) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<InquiryUploadedImage[]>([]);
  const [imagesUploading, setImagesUploading] = useState(false);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [sendEmail, setSendEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const uploadImage = async (file: File) => {
    const response = await inquiryService.uploadMessageImage(file);
    if (!response.data.data) {
      throw new ApiApplicationError('이미지 업로드 결과를 확인할 수 없습니다.');
    }
    return response.data.data;
  };

  const submit = async () => {
    if (!content.trim() || busy || imagesUploading) return;
    setBusy(true);
    setError('');
    try {
      const attachmentIds = images.map((image) => image.id);
      if (admin) {
        await inquiryService.adminAddMessage(
          inquiryId,
          content.trim(),
          attachmentIds,
          sendEmail,
        );
      } else {
        await inquiryService.addMessage(inquiryId, content.trim(), attachmentIds);
      }
      setContent('');
      setImages([]);
      setUploaderKey((current) => current + 1);
      setSendEmail(false);
      onSent();
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, '메시지 등록에 실패했습니다. 다시 시도해 주세요.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        aria-label="추가 메시지 내용"
        placeholder="추가 내용을 입력해 주세요."
        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <InquiryImageUploader
        key={uploaderKey}
        uploadImage={uploadImage}
        onChange={setImages}
        onUploadingChange={setImagesUploading}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-2">
        {admin && (
          <label className="ml-auto text-xs text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(event) => setSendEmail(event.target.checked)}
              className="mr-1"
            />
            사용자에게 이메일 알림 발송
          </label>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || imagesUploading || !content.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? '등록 중...' : '메시지 등록'}
        </button>
      </div>
      {error && (
        <p role="alert" aria-live="assertive" className="text-xs text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
