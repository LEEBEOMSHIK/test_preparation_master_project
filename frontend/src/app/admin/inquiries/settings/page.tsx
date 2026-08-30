'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { extractApiErrorMessage } from '@/lib/apiError';
import { inquiryService } from '@/services/inquiryService';

const MAX_RECIPIENTS = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmails(recipients: string[]): string[] {
  return recipients.map((recipient) => recipient.trim().toLowerCase()).filter(Boolean);
}

function validateRecipients(enabled: boolean, recipients: string[]): string | null {
  const normalized = normalizeEmails(recipients);
  if (enabled && normalized.length === 0) {
    return '알림을 사용하려면 수신 이메일을 1개 이상 입력해 주세요.';
  }
  if (normalized.length > MAX_RECIPIENTS) {
    return '수신 이메일은 최대 10개까지 입력할 수 있습니다.';
  }
  if (normalized.some((recipient) => !EMAIL_PATTERN.test(recipient))) {
    return '올바른 이메일 주소를 입력해 주세요.';
  }
  if (new Set(normalized).size !== normalized.length) {
    return '중복된 이메일 주소가 있습니다.';
  }
  return null;
}

export default function InquirySettingsPage() {
  const [enabled, setEnabled] = useState(false);
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    inquiryService
      .getNotificationSettings()
      .then((response) => {
        const settings = response.data.data;
        if (!settings) return;
        setEnabled(settings.enabled);
        setRecipients(settings.recipientEmails.length > 0 ? settings.recipientEmails : ['']);
      })
      .catch((requestError: unknown) => {
        setError(extractApiErrorMessage(requestError, '설정을 불러오지 못했습니다.'));
      })
      .finally(() => setLoading(false));
  }, []);

  const updateRecipient = (index: number, value: string) => {
    setRecipients((current) => current.map((recipient, currentIndex) => (
      currentIndex === index ? value : recipient
    )));
  };

  const removeRecipient = (index: number) => {
    setRecipients((current) => (
      current.length === 1 ? [''] : current.filter((_, currentIndex) => currentIndex !== index)
    ));
  };

  const save = async () => {
    const validationError = validateRecipients(enabled, recipients);
    if (validationError) {
      setError(validationError);
      setSuccess('');
      return;
    }

    const normalized = normalizeEmails(recipients);
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await inquiryService.updateNotificationSettings(enabled, normalized);
      const settings = response.data.data;
      setRecipients(settings && settings.recipientEmails.length > 0 ? settings.recipientEmails : ['']);
      if (settings) setEnabled(settings.enabled);
      setSuccess('문의·요청 알림 설정을 저장했습니다.');
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '설정 저장에 실패했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link
          href="/admin/inquiries"
          className="text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← 문의·요청 관리
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          관리자 수신 이메일 설정
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          신규 접수와 사용자 추가 메시지를 받을 관리자 이메일을 설정합니다.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 rounded-xl border border-gray-200 p-5 dark:border-gray-700">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-28" />
        </div>
      ) : (
        <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            관리자 이메일 알림 사용
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">수신 이메일</h3>
              <span className="text-xs text-gray-400">{recipients.length}/{MAX_RECIPIENTS}</span>
            </div>
            {recipients.map((recipient, index) => (
              <div key={index} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  aria-label={`수신 이메일 ${index + 1}`}
                  value={recipient}
                  onChange={(event) => updateRecipient(index, event.target.value)}
                  placeholder="admin@example.com"
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => removeRecipient(index)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={recipients.length >= MAX_RECIPIENTS}
              onClick={() => setRecipients((current) => [...current, ''])}
              className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
            >
              주소 추가
            </button>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
