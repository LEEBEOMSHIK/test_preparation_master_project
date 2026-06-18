'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { notionService, type NotionStatus } from '@/services/notionService';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Suspense fallback ─────────────────────────────────────────────────────────
function SettingsPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
      <Skeleton className="h-7 w-16" />
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full shrink-0" />
        </div>
        <div className="pt-4 border-t border-gray-100">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Inner component (useSearchParams 사용) ────────────────────────────────────
function UserSettingsContent() {
  const searchParams = useSearchParams();
  const notionParam = searchParams.get('notion'); // connected | failed (콜백 후)
  const [notion, setNotion] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    notionService.getStatus()
      .then(res => { if (res.data.data) setNotion(res.data.data); })
      .catch(() => setNotion(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setBusy(true);
    try {
      const res = await notionService.getAuthorizeUrl();
      const url = res.data.data?.url;
      if (url) window.location.href = url;
    } catch {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm('Notion 연동을 해제하시겠습니까?')) return;
    setBusy(true);
    try {
      await notionService.disconnect();
      setNotion(prev => prev ? { ...prev, connected: false, workspaceName: null } : prev);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">설정</h1>

      {/* 콜백 피드백 */}
      {notionParam === 'connected' && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Notion 워크스페이스가 연결되었습니다.
        </div>
      )}
      {notionParam === 'failed' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Notion 연결에 실패했습니다. 다시 시도해 주세요.
        </div>
      )}

      {/* Notion 연동 카드 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-800">Notion 연동</h2>
            <p className="text-sm text-gray-500 mt-1">
              개념노트를 내 Notion 워크스페이스로 내보낼 수 있습니다.
            </p>
          </div>
          {/* 상태 배지 */}
          {!loading && notion && (
            <span className={[
              'shrink-0 text-xs px-2.5 py-1 rounded-full border',
              !notion.configured ? 'bg-gray-100 text-gray-500 border-gray-200'
                : notion.connected ? 'bg-green-50 text-green-600 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200',
            ].join(' ')}>
              {!notion.configured ? '서버 미설정' : notion.connected ? '연결됨' : '미연결'}
            </span>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {loading ? (
            <div className="animate-pulse">
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          ) : !notion?.configured ? (
            <p className="text-sm text-gray-400">
              서버에 Notion 연동 설정(client id/secret)이 필요합니다. 설정 후 연결 버튼이 표시됩니다.
            </p>
          ) : notion.connected ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                워크스페이스: <span className="font-medium text-gray-800">{notion.workspaceName ?? '연결됨'}</span>
              </p>
              <button
                onClick={handleDisconnect}
                disabled={busy}
                className="text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                연동 해제
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={busy}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {busy ? '이동 중…' : 'Notion 연결'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Page export (Suspense 경계) ───────────────────────────────────────────────
export default function UserSettingsPage() {
  return (
    <Suspense fallback={<SettingsPageSkeleton />}>
      <UserSettingsContent />
    </Suspense>
  );
}
