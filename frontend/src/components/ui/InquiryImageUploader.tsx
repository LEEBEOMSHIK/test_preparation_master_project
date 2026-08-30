'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { extractApiErrorMessage } from '@/lib/apiError';
import type { UploadImageResult } from '@/services/inquiryService';

const MAX_IMAGE_COUNT = 3;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const ALLOWED_IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;

type UploadStatus = 'uploading' | 'uploaded';

interface UploadingImage {
  key: string;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  status: UploadStatus;
  id?: number;
  url?: string;
}

export interface InquiryUploadedImage extends UploadImageResult {
  fileName: string;
  fileSize: number;
}

interface InquiryImageUploaderProps {
  uploadImage: (file: File) => Promise<UploadImageResult>;
  onChange: (images: InquiryUploadedImage[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createPreviewUrl(file: File): string {
  return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
}

export function InquiryImageUploader({
  uploadImage,
  onChange,
  onUploadingChange,
  disabled = false,
}: InquiryImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sequenceRef = useRef(0);
  const previewUrlsRef = useRef<string[]>([]);
  const activeUploadKeysRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(false);
  const inputId = useId();
  const [items, setItems] = useState<UploadingImage[]>([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const releasePreviewUrl = (previewUrl: string) => {
    if (!previewUrl || !previewUrlsRef.current.includes(previewUrl)) return;
    if (typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(previewUrl);
    }
    previewUrlsRef.current = previewUrlsRef.current.filter((trackedUrl) => trackedUrl !== previewUrl);
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeUploadKeysRef.current.clear();
      [...previewUrlsRef.current].forEach(releasePreviewUrl);
    };
  }, []);

  useEffect(() => {
    onChange(items.flatMap((item): InquiryUploadedImage[] => (
      item.status === 'uploaded' && item.id !== undefined && item.url !== undefined
        ? [{ id: item.id, url: item.url, fileName: item.fileName, fileSize: item.fileSize }]
        : []
    )));
    onUploadingChange?.(items.some((item) => item.status === 'uploading'));
  }, [items, onChange, onUploadingChange]);

  const removeItem = (key: string) => {
    const item = items.find((candidate) => candidate.key === key);
    activeUploadKeysRef.current.delete(key);
    if (item) releasePreviewUrl(item.previewUrl);
    setItems((current) => current.filter((candidate) => candidate.key !== key));
  };

  const uploadFile = async (item: UploadingImage, file: File) => {
    try {
      const uploaded = await uploadImage(file);
      if (!mountedRef.current || !activeUploadKeysRef.current.delete(item.key)) return;
      setItems((current) => current.map((candidate) => (
        candidate.key === item.key
          ? { ...candidate, status: 'uploaded', id: uploaded.id, url: uploaded.url }
          : candidate
      )));
    } catch (uploadError) {
      if (!mountedRef.current || !activeUploadKeysRef.current.delete(item.key)) return;
      releasePreviewUrl(item.previewUrl);
      setItems((current) => current.filter((candidate) => candidate.key !== item.key));
      setError(extractApiErrorMessage(uploadError, '이미지 업로드에 실패했습니다. 다시 시도해 주세요.'));
    }
  };

  const addFiles = (fileList: FileList | File[]) => {
    if (disabled) return;

    const selectedFiles = Array.from(fileList);
    const validationErrors: string[] = [];
    const validFiles = selectedFiles.filter((file) => {
      if (!ALLOWED_IMAGE_EXTENSION.test(file.name) || !ALLOWED_IMAGE_TYPES.has(file.type)) {
        validationErrors.push(`${file.name}: JPG/JPEG/PNG/GIF/WebP 형식만 첨부할 수 있습니다.`);
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        validationErrors.push(`${file.name}: 파일당 10MB 이하만 첨부할 수 있습니다.`);
        return false;
      }
      return true;
    });
    const availableSlots = Math.max(0, MAX_IMAGE_COUNT - items.length);
    const acceptedFiles = validFiles.slice(0, availableSlots);
    const skippedCount = validFiles.length - acceptedFiles.length;
    if (skippedCount > 0) {
      validationErrors.push(
        `이미지는 최대 3장까지 첨부할 수 있습니다. ${validFiles.length}장 중 ${skippedCount}장은 추가되지 않았습니다.`,
      );
    }
    setError(validationErrors.join(' '));

    const uploadingItems = acceptedFiles.map((file) => {
      const previewUrl = createPreviewUrl(file);
      if (previewUrl) previewUrlsRef.current.push(previewUrl);
      sequenceRef.current += 1;
      return {
        key: `${file.name}-${file.lastModified}-${sequenceRef.current}`,
        fileName: file.name,
        fileSize: file.size,
        previewUrl,
        status: 'uploading' as const,
      };
    });
    if (uploadingItems.length === 0) return;

    uploadingItems.forEach((item) => activeUploadKeysRef.current.add(item.key));
    setItems((current) => [...current, ...uploadingItems]);
    uploadingItems.forEach((item, index) => {
      void uploadFile(item, acceptedFiles[index]);
    });
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        disabled={disabled}
        aria-describedby={`${inputId}-guide`}
        className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-100'
            : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-indigo-400 dark:hover:bg-gray-700'
        }`}
      >
        이미지 파일 선택 또는 드래그 앤 드롭
      </button>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
        onChange={handleInputChange}
        className="sr-only"
        aria-label="이미지 파일 선택"
      />
      <p id={`${inputId}-guide`} className="text-xs leading-5 text-gray-600 dark:text-gray-300">
        최대 3장, 파일당 10MB 이하, JPG/JPEG/PNG/GIF/WebP
      </p>

      {items.length > 0 && (
        <ul className="space-y-2" aria-label="첨부 이미지 목록">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-2 dark:border-gray-700"
            >
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={`${item.fileName} 썸네일`}
                  className="h-12 w-12 rounded-md object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-md bg-gray-100 dark:bg-gray-700" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800 dark:text-gray-100">{item.fileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(item.fileSize)}</p>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {item.status === 'uploading' ? '업로드 중' : '업로드 완료'}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                aria-label={`${item.fileName} 삭제`}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="text-sm leading-5 text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
