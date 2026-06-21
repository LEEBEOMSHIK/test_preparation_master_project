'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { notionService, type NotionStatus } from '@/services/notionService';
import { userProfileService } from '@/services/userProfileService';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/Skeleton';

// ── Suspense fallback ─────────────────────────────────────────────────────────
function SettingsPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 animate-pulse">
      <Skeleton className="h-7 w-16" />
      {/* 닉네임 섹션 shimmer */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="pt-4 border-t border-gray-100 flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-16 rounded-lg" />
        </div>
      </div>
      {/* Notion 섹션 shimmer */}
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

  const storeUser = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // ── 닉네임 상태 ──────────────────────────────────────────────────────────
  const [nicknameLoading, setNicknameLoading] = useState(true);
  const [nicknameValue, setNicknameValue] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [nicknameFeedback, setNicknameFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Notion 상태 ───────────────────────────────────────────────────────────
  const [notion, setNotion] = useState<NotionStatus | null>(null);
  const [notionLoading, setNotionLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // 닉네임 초기값: store → 없으면 me() 호출
  useEffect(() => {
    if (storeUser?.nickname != null) {
      setNicknameValue(storeUser.nickname);
      setNicknameLoading(false);
    } else {
      authService.me()
        .then(res => {
          const nickname = res.data.data?.nickname ?? '';
          setNicknameValue(nickname);
          if (res.data.data) updateUser({ nickname: res.data.data.nickname });
        })
        .catch(() => setNicknameValue(''))
        .finally(() => setNicknameLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    notionService.getStatus()
      .then(res => { if (res.data.data) setNotion(res.data.data); })
      .catch(() => setNotion(null))
      .finally(() => setNotionLoading(false));
  }, []);

  async function handleSaveNickname() {
    const trimmed = nicknameValue.trim();
    if (!trimmed) return;
    setNicknameSaving(true);
    setNicknameFeedback(null);
    try {
      await userProfileService.patchNickname(trimmed);
      updateUser({ nickname: trimmed });
      setNicknameFeedback({ type: 'success', msg: '닉네임이 저장되었습니다.' });
    } catch (err: unknown) {
      // 서버 에러 응답에서 message 추출 (409 중복 등 4xx 포함)
      let errorMsg = '저장에 실패했습니다. 다시 시도해 주세요.';
      if (
        err !== null &&
        typeof err === 'object' &&
        'response' in err &&
        err.response !== null &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data !== null &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof (err.response.data as { message: unknown }).message === 'string'
      ) {
        errorMsg = (err.response.data as { message: string }).message;
      }
      setNicknameFeedback({ type: 'error', msg: errorMsg });
    } finally {
      setNicknameSaving(false);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setNicknameFeedback(null), 3000);
    }
  }

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

  const isSaveDisabled = nicknameSaving || nicknameValue.trim().length === 0;

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

      {/* 닉네임 수정 카드 */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <div>
          <h2 className="font-semibold text-gray-800">닉네임 수정</h2>
          <p className="text-sm text-gray-500 mt-1">
            공개 개념노트 탐색에서 다른 사용자에게 보이는 이름입니다.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {nicknameLoading ? (
            <div className="animate-pulse flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 w-16 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nicknameValue}
                  onChange={e => setNicknameValue(e.target.value)}
                  maxLength={20}
                  placeholder="닉네임 입력 (최대 20자)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={isSaveDisabled}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nicknameSaving ? '저장 중…' : '저장'}
                </button>
              </div>
              {nicknameFeedback && (
                <p className={`text-xs ${nicknameFeedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {nicknameFeedback.msg}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

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
          {!notionLoading && notion && (
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
          {notionLoading ? (
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
