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
  const context = admin
    ? {
      heading: '사용자에게 답변',
      guide: '등록한 내용은 문의 타임라인에 관리자 답변으로 추가되며 상태는 변경되지 않습니다.',
      imageTitle: '답변 첨부 이미지 (선택)',
      submit: '답변 보내기',
      error: '답변 전송에 실패했습니다. 다시 시도해 주세요.',
    }
    : {
      heading: '답변 등록',
      guide: '관리자와의 대화는 새 메시지로 등록됩니다.',
      imageTitle: '답변 첨부 이미지 (선택)',
      submit: '답변 등록',
      error: '답변 등록에 실패했습니다. 다시 시도해 주세요.',
    };
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
      setError(extractApiErrorMessage(submitError, context.error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{context.heading}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{context.guide}</p>
      </div>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        aria-label="답변 내용"
        placeholder="답변 내용을 입력해 주세요."
        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
      <InquiryImageUploader
        key={uploaderKey}
        title={context.imageTitle}
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
            이 답변 내용을 이메일로도 발송
          </label>
        )}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || imagesUploading || !content.trim()}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? '전송 중...' : context.submit}
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
