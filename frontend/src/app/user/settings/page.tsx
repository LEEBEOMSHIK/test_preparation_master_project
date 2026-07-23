'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { notionService, type NotionStatus } from '@/services/notionService';
import { userProfileService } from '@/services/userProfileService';
import { authService } from '@/services/authService';
import { examApplicationService } from '@/services/examApplicationService';
import { useAuthStore } from '@/store/authStore';
import { Skeleton, CardListSkeleton } from '@/components/ui/Skeleton';
import { ExamApplicationFormModal } from '@/components/ui/ExamApplicationFormModal';
import { InterestExamTypeModal } from '@/components/ui/InterestExamTypeModal';
import { getExamDDayLabel, getExamDDayBadgeClass } from '@/lib/date';
import type { UserExamApplication } from '@/types';

// ── Suspense fallback ─────────────────────────────────────────────────────────
function SettingsPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-pulse">
      <Skeleton className="h-7 w-16" />

      {/* 계정 그룹 shimmer */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-10" />
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
      </div>

      {/* 연동 그룹 shimmer */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-10" />
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

      {/* 시험 관리 그룹 shimmer */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-14" />
        {/* 관심 시험 유형 섹션 shimmer */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
            <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
          </div>
        </div>
        {/* 내 시험 접수 정보 섹션 shimmer */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="pt-4 border-t border-gray-100">
            <CardListSkeleton rows={2} />
          </div>
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

  // ── 내 시험 접수 정보 상태 ────────────────────────────────────────────────
  const [applications, setApplications] = useState<UserExamApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [appModalEditing, setAppModalEditing] = useState<UserExamApplication | null>(null);

  // ── 관심 시험 유형 상태 ────────────────────────────────────────────────────
  const [showInterestModal, setShowInterestModal] = useState(false);
  const interestedExamTypes = storeUser?.interestedExamTypes ?? [];

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

  useEffect(() => {
    examApplicationService.getMine()
      .then(res => setApplications(res.data.data ?? []))
      .catch(() => setApplications([]))
      .finally(() => setApplicationsLoading(false));
  }, []);

  const openEditApplication = (app: UserExamApplication) => {
    setAppModalEditing(app);
    setAppModalOpen(true);
  };

  const handleApplicationSaved = (saved: UserExamApplication) => {
    setApplications(prev => {
      const exists = prev.some(a => a.id === saved.id);
      return exists ? prev.map(a => (a.id === saved.id ? saved : a)) : [...prev, saved];
    });
  };

  const handleDeleteApplication = async (id: number) => {
    if (!window.confirm('이 접수 정보를 삭제하시겠습니까?')) return;
    await examApplicationService.remove(id);
    setApplications(prev => prev.filter(a => a.id !== id));
  };

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

      <div className="space-y-8">
        {/* 계정 그룹 */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">계정</p>

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
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
        </div>

        {/* 연동 그룹 */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">연동</p>

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

        {/* 시험 관리 그룹 */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">시험 관리</p>

          {/* 관심 시험 유형 카드 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <div>
              <h2 className="font-semibold text-gray-800">관심 시험 유형</h2>
              <p className="text-sm text-gray-500 mt-1">
                선택한 시험 유형을 기준으로 시험 정보·퀴즈가 우선 노출됩니다.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              {interestedExamTypes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {interestedExamTypes.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">선택된 관심 시험 유형이 없습니다.</p>
              )}
              <button
                type="button"
                onClick={() => setShowInterestModal(true)}
                className="shrink-0 text-sm text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition"
              >
                변경
              </button>
            </div>
          </section>

          {/* 내 시험 접수 정보 카드 */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <div>
              <h2 className="font-semibold text-gray-800">내 시험 접수 정보</h2>
              <p className="text-sm text-gray-500 mt-1">
                직접 입력한 접수일·시험일을 여기서도 확인·수정할 수 있습니다.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              {applicationsLoading ? (
                <CardListSkeleton rows={3} />
              ) : applications.length === 0 ? (
                <p className="text-sm text-gray-400">
                  등록된 접수 정보가 없습니다.{' '}
                  <Link href="/user/exam-info" className="text-indigo-500 hover:underline">
                    시험 정보에서 등록하기
                  </Link>
                </p>
              ) : (
                <div className="space-y-2">
                  {applications.map(app => {
                    const dDayLabel = getExamDDayLabel(app.applicationDate, app.examDate);
                    return (
                    <div key={app.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                          {app.examType && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 shrink-0">
                              {app.examType}
                            </span>
                          )}
                          <span className="truncate min-w-0 flex-1" title={app.examName}>{app.examName}</span>
                          {dDayLabel && (
                            <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${getExamDDayBadgeClass(app.applicationDate, app.examDate)}`}>
                              {dDayLabel}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {app.applicationDate && <>접수일 {app.applicationDate}</>}
                          {app.applicationDate && app.examDate && ' · '}
                          {app.examDate && <>시험일 {app.examDate}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => openEditApplication(app)} aria-label="접수 정보 수정"
                          className="text-gray-400 hover:text-indigo-600">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => handleDeleteApplication(app.id)} aria-label="접수 정보 삭제"
                          className="text-gray-400 hover:text-red-500">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {appModalOpen && appModalEditing && (
        <ExamApplicationFormModal
          open={appModalOpen}
          onClose={() => setAppModalOpen(false)}
          onSaved={handleApplicationSaved}
          editing={appModalEditing}
        />
      )}

      {/* 관심 시험 유형 설정 모달 */}
      <InterestExamTypeModal
        open={showInterestModal}
        onClose={() => setShowInterestModal(false)}
      />
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
