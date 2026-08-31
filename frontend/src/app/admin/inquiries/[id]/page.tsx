'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { InquiryMessageComposer } from '@/components/ui/InquiryMessageComposer';
import { InquiryTimeline } from '@/components/ui/InquiryTimeline';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { extractApiErrorMessage } from '@/lib/apiError';
import { getAllowedAdminStatuses, getInquiryTargetAreaLabel, isInquiryClosed } from '@/lib/inquiry';
import { emailTemplateService } from '@/services/emailTemplateService';
import {
  inquiryService,
  type InquiryEmailDelivery,
  type InquiryEmailDeliveryStatus,
  type InquiryEmailEventType,
} from '@/services/inquiryService';
import type {
  EmailTemplateBinding,
  EmailTemplateEventCode,
  InquiryDetail,
  InquiryStatus,
} from '@/types';
import { INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from '@/types';

const STATUS_COLOR: Record<InquiryStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  ON_HOLD: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  ANSWERED: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  UNABLE_TO_PROCESS: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
};

const DELIVERY_EVENT_LABEL: Record<InquiryEmailEventType, string> = {
  NEW_INQUIRY: '신규 접수',
  USER_MESSAGE: '사용자 메시지',
  ADMIN_MESSAGE: '관리자 답변',
  ANSWERED: '답변 완료',
  COMPLETED: '처리 완료',
  UNABLE_TO_PROCESS: '처리 불가',
};

const STATUS_EMAIL_EVENT_CODE: Partial<Record<InquiryStatus, EmailTemplateEventCode>> = {
  ANSWERED: 'INQUIRY_ANSWERED',
  COMPLETED: 'INQUIRY_COMPLETED',
  UNABLE_TO_PROCESS: 'INQUIRY_UNABLE_TO_PROCESS',
};

export default function AdminInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [deliveries, setDeliveries] = useState<InquiryEmailDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [deliveryPage, setDeliveryPage] = useState(0);
  const [deliveryTotalElements, setDeliveryTotalElements] = useState(0);
  const [deliveryTotalPages, setDeliveryTotalPages] = useState(0);
  const [deliveryStatus, setDeliveryStatus] = useState<InquiryEmailDeliveryStatus | ''>('');
  const [emailBindings, setEmailBindings] = useState<EmailTemplateBinding[]>([]);
  const [emailBindingsLoading, setEmailBindingsLoading] = useState(true);
  const [emailBindingsError, setEmailBindingsError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InquiryStatus | ''>('');
  const [sendEmail, setSendEmail] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');
  const [statusEmailWarning, setStatusEmailWarning] = useState('');
  const [statusTemplateSettingsUrl, setStatusTemplateSettingsUrl] = useState<string | null>(null);
  const [confirmingStatusUpdate, setConfirmingStatusUpdate] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDeliveries = useCallback(async () => {
    setDeliveryLoading(true);
    try {
      const response = await inquiryService.getEmailDeliveries(
        id,
        deliveryPage,
        20,
        deliveryStatus || undefined,
      );
      const result = response.data.data;
      setDeliveries(result?.content ?? []);
      setDeliveryTotalElements(result?.totalElements ?? 0);
      setDeliveryTotalPages(result?.totalPages ?? 0);
      setDeliveryError('');
    } catch (requestError: unknown) {
      setDeliveryError(extractApiErrorMessage(requestError, '이메일 발송 이력을 불러오지 못했습니다.'));
    } finally {
      setDeliveryLoading(false);
    }
  }, [deliveryPage, deliveryStatus, id]);

  const loadInquiry = useCallback(async () => {
    const response = await inquiryService.adminGetOne(id);
    if (response.data.data) setInquiry(response.data.data);
  }, [id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        await loadInquiry();
      } catch (requestError: unknown) {
        setError(extractApiErrorMessage(requestError, '문의·요청을 불러오지 못했습니다.'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [loadInquiry]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  useEffect(() => {
    const loadEmailBindings = async () => {
      setEmailBindingsLoading(true);
      setEmailBindingsError('');
      try {
        const response = await emailTemplateService.getBindings();
        setEmailBindings(response.data.data ?? []);
      } catch (requestError: unknown) {
        setEmailBindingsError(extractApiErrorMessage(
          requestError,
          '이메일 템플릿 연결 정보를 불러오지 못했습니다.',
        ));
      } finally {
        setEmailBindingsLoading(false);
      }
    };
    void loadEmailBindings();
  }, []);

  const handleMessageSent = () => {
    void loadInquiry();
    void loadDeliveries();
  };

  const performStatusUpdate = async () => {
    if (!inquiry || !selectedStatus || updatingStatus) return;

    setUpdatingStatus(true);
    setError('');
    setStatusSuccess('');
    setStatusEmailWarning('');
    setStatusTemplateSettingsUrl(null);
    setConfirmingStatusUpdate(false);
    try {
      const response = await inquiryService.adminUpdateStatus(
        inquiry.id,
        selectedStatus,
        isInquiryClosed(selectedStatus) ? sendEmail : false,
      );
      const result = response.data.data;
      if (result) {
        setInquiry(result.inquiry);
        setStatusSuccess(`상태를 ${INQUIRY_STATUS_LABEL[selectedStatus]}로 변경했습니다.`);
        if (result.emailOutcome.startsWith('SKIPPED_')) {
          setStatusEmailWarning(result.emailMessage);
          setStatusTemplateSettingsUrl(result.templateSettingsUrl);
        }
        if (result.emailOutcome === 'QUEUED') {
          await loadDeliveries();
        }
      }
      setSelectedStatus('');
      setSendEmail(false);
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '상태를 변경하지 못했습니다.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = () => {
    if (!inquiry || !selectedStatus || updatingStatus || selectedStatus === inquiry.status) return;
    const hasAdminMessage = inquiry.messages.some((message) => message.authorRole === 'ADMIN');
    if (isInquiryClosed(selectedStatus) && !hasAdminMessage) {
      setConfirmingStatusUpdate(true);
      return;
    }
    void performStatusUpdate();
  };

  const handleReopen = async () => {
    if (!inquiry || updatingStatus) return;
    setUpdatingStatus(true);
    setError('');
    setStatusSuccess('');
    setStatusEmailWarning('');
    setStatusTemplateSettingsUrl(null);
    try {
      const response = await inquiryService.adminUpdateStatus(inquiry.id, 'IN_PROGRESS', false);
      if (response.data.data) {
        setInquiry(response.data.data.inquiry);
        setStatusSuccess(`상태를 ${INQUIRY_STATUS_LABEL.IN_PROGRESS}으로 변경했습니다.`);
      }
      setSelectedStatus('');
      setSendEmail(false);
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '문의·요청을 다시 열지 못했습니다.'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRetry = async (deliveryId: number) => {
    setRetryingDeliveryId(deliveryId);
    setDeliveryError('');
    try {
      await inquiryService.retryEmailDelivery(deliveryId);
      await loadDeliveries();
    } catch (requestError: unknown) {
      setDeliveryError(extractApiErrorMessage(requestError, '이메일을 재발송하지 못했습니다.'));
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  const handleDelete = async () => {
    if (!inquiry || !confirm('이 문의·요청을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) return;
    setDeleting(true);
    setError('');
    try {
      await inquiryService.adminDelete(inquiry.id);
      router.push('/admin/inquiries');
    } catch (requestError: unknown) {
      setError(extractApiErrorMessage(requestError, '문의·요청을 삭제하지 못했습니다.'));
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl space-y-5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {error || '문의·요청을 찾을 수 없습니다.'}
        </p>
      </div>
    );
  }

  const closed = isInquiryClosed(inquiry.status);
  const allowedStatuses = getAllowedAdminStatuses(inquiry.requestType);
  const selectedIsClosed = selectedStatus !== '' && isInquiryClosed(selectedStatus);
  const selectedEmailEventCode = selectedStatus === ''
    ? undefined
    : STATUS_EMAIL_EVENT_CODE[selectedStatus];
  const selectedEmailBinding = emailBindings.find(
    (binding) => binding.eventCode === selectedEmailEventCode,
  );
  const statusEmailAvailable = selectedEmailBinding?.sendable === true;
  const bindingUnavailableReason = emailBindingsLoading
    ? '이메일 템플릿 연결 정보를 확인하는 중입니다.'
    : emailBindingsError
      || selectedEmailBinding?.unavailableReason
      || (!selectedEmailBinding ? '연결된 이메일 템플릿이 없습니다.' : '이메일을 발송할 수 없습니다.');

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/inquiries"
          className="text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← 문의·요청 관리
        </Link>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="self-start rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          {deleting ? '삭제 중...' : '문의·요청 삭제'}
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{inquiry.title}</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              #{inquiry.id} · {INQUIRY_TYPE_LABEL[inquiry.requestType]}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[inquiry.status]}`}>
            {INQUIRY_STATUS_LABEL[inquiry.status]}
          </span>
        </div>
        <dl className="grid gap-3 bg-gray-50 px-5 py-4 text-sm dark:bg-gray-800/60 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-400">작성자</dt>
            <dd className="mt-0.5 text-gray-700 dark:text-gray-200">{inquiry.userName ?? '-'}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">등록일</dt>
            <dd className="mt-0.5 text-gray-700 dark:text-gray-200">
              {inquiry.createdAt.slice(0, 16).replace('T', ' ')}
            </dd>
          </div>
          {inquiry.targetArea && (
            <div>
              <dt className="text-xs text-gray-400">발생 영역</dt>
              <dd className="mt-0.5 text-gray-700 dark:text-gray-200">
                {getInquiryTargetAreaLabel(inquiry.targetArea)}
              </dd>
            </div>
          )}
          {inquiry.detailLocation && (
            <div>
              <dt className="text-xs text-gray-400">상세 위치</dt>
              <dd className="mt-0.5 break-all text-gray-700 dark:text-gray-200">{inquiry.detailLocation}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="space-y-3" aria-label="문의·요청 대화">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">대화 이력</h3>
        <InquiryTimeline inquiry={inquiry} />
      </section>

      {!closed && (
        <section className="space-y-3">
          <InquiryMessageComposer inquiryId={inquiry.id} admin onSent={handleMessageSent} />
        </section>
      )}

      <section
        role="region"
        aria-label="상태 변경"
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">상태 변경</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              접수 유형에 허용된 상태만 선택할 수 있습니다.
            </p>
          </div>
          {closed && (
            <button
              type="button"
              onClick={() => void handleReopen()}
              disabled={updatingStatus}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              다시 열기
            </button>
          )}
        </div>

        {!closed && (
          <div className="space-y-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              처리 상태
              <select
                value={selectedStatus}
                onChange={(event) => {
                  setSelectedStatus(event.target.value as InquiryStatus | '');
                  setSendEmail(false);
                  setError('');
                  setStatusSuccess('');
                  setStatusEmailWarning('');
                  setStatusTemplateSettingsUrl(null);
                }}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">선택하세요</option>
                {allowedStatuses.map((status) => (
                  <option key={status} value={status}>{INQUIRY_STATUS_LABEL[status]}</option>
                ))}
              </select>
            </label>

            {selectedIsClosed && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(event) => setSendEmail(event.target.checked)}
                    disabled={!statusEmailAvailable || emailBindingsLoading}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                  />
                  상태 변경 안내 이메일 발송
                </label>
                {!statusEmailAvailable && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {bindingUnavailableReason}{' '}
                    <Link
                      href="/admin/email-templates?tab=bindings"
                      className="font-medium underline underline-offset-2"
                    >
                      이메일 템플릿 관리
                    </Link>
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || selectedStatus === inquiry.status || updatingStatus}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {updatingStatus
                  ? '변경 중...'
                  : selectedStatus
                    ? `${INQUIRY_STATUS_LABEL[selectedStatus]}로 변경`
                    : '상태 변경'}
              </button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {statusSuccess && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">
          {statusSuccess}
        </p>
      )}
      {statusEmailWarning && (
        <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <p>{statusEmailWarning}</p>
          {statusTemplateSettingsUrl && (
            <Link
              href={statusTemplateSettingsUrl}
              className="mt-1 inline-block font-medium underline underline-offset-2"
            >
              이메일 템플릿 관리
            </Link>
          )}
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">이메일 발송 이력</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              발송 실패 건은 원인을 확인한 뒤 재발송할 수 있습니다.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              발송 상태
              <select
                value={deliveryStatus}
                onChange={(event) => {
                  setDeliveryStatus(event.target.value as InquiryEmailDeliveryStatus | '');
                  setDeliveryPage(0);
                }}
                className="ml-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">전체</option>
                <option value="FAILED">발송 실패</option>
              </select>
            </label>
            <button
              type="button"
              onClick={() => void loadDeliveries()}
              disabled={deliveryLoading}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
            >
              발송 이력 새로고침
            </button>
          </div>
        </div>
        {deliveryError && <p className="text-sm text-red-600 dark:text-red-400">{deliveryError}</p>}
        {deliveryLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : deliveries.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-400 dark:bg-gray-800/60">
            이메일 발송 이력이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {deliveries.map((delivery) => (
              <li key={delivery.id} className="space-y-2 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {DELIVERY_EVENT_LABEL[delivery.eventType]} · {delivery.recipientEmail}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {delivery.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {delivery.createdAt.slice(0, 16).replace('T', ' ')} · 시도 {delivery.attemptCount}회
                    </p>
                  </div>
                  <span className={`self-start rounded-full px-2 py-1 text-xs font-medium ${
                    delivery.status === 'SENT'
                      ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                      : delivery.status === 'FAILED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300'
                  }`}>
                    {delivery.status === 'SENT' ? '발송 성공' : delivery.status === 'FAILED' ? '발송 실패' : '발송 대기'}
                  </span>
                </div>
                {delivery.lastError && (
                  <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
                    {delivery.lastError}
                  </p>
                )}
                {delivery.status === 'FAILED' && (
                  <button
                    type="button"
                    onClick={() => void handleRetry(delivery.id)}
                    disabled={retryingDeliveryId === delivery.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    {retryingDeliveryId === delivery.id ? '재발송 중...' : '재발송'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!deliveryLoading && deliveryTotalElements > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-400">총 {deliveryTotalElements}건</span>
            <Pagination
              page={deliveryPage}
              totalPages={deliveryTotalPages}
              onChange={setDeliveryPage}
            />
          </div>
        )}
      </section>

      {confirmingStatusUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-update-confirm-title"
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900"
          >
            <h2 id="status-update-confirm-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
              답변 없이 상태 변경
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              사용자에게 별도 답변을 등록하지 않고 상태를 종료합니다. 계속하시겠습니까?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingStatusUpdate(false)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void performStatusUpdate()}
                disabled={updatingStatus}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                답변 없이 상태 변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
