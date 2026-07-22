'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { examInfoService } from '@/services/examInfoService';
import { examApplicationService } from '@/services/examApplicationService';
import { ExamApplicationFormModal } from '@/components/ui/ExamApplicationFormModal';
import type { ExamApplicationPrefill } from '@/components/ui/ExamApplicationFormModal';
import { InterestExamTypeModal } from '@/components/ui/InterestExamTypeModal';
import { ExamInfoCardSkeleton } from '@/components/ui/Skeleton';
import { parseLocalDate, getExamDDayLabel, getExamDDayBadgeClass } from '@/lib/date';
import type { ExamInfo, UserExamApplication } from '@/types';

const PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-yellow-100 text-yellow-700',
  'bg-amber-100 text-amber-700',
  'bg-red-100 text-red-700',
  'bg-purple-100 text-purple-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
];

function examTypeColor(name: string): string {
  const idx = name.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[idx];
}

function fmtRange(val: string | undefined): string {
  if (!val) return '';
  const [start = '', end = ''] = val.split(' ~ ').map(s => s.trim().replace(/-/g, '.'));
  return end ? `${start} ~ ${end}` : start;
}

type PhaseStatus = 'active' | 'upcoming' | 'past' | 'none';

function getPhaseStatus(rangeStr: string | undefined): PhaseStatus {
  if (!rangeStr) return 'none';
  const parts = rangeStr.split(' ~ ').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return 'none';
  const startDate = parseLocalDate(parts[0]);
  if (isNaN(startDate.getTime())) return 'none';
  const endDate = parts[1] ? parseLocalDate(parts[1]) : startDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (endDate < today) return 'past';
  if (startDate > today) return 'upcoming';
  return 'active';
}

const PHASE_STYLES: Record<PhaseStatus, { box: string; badge: string; badgeColor: string; text: string }> = {
  active:   { box: 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-700', badge: '진행 중', badgeColor: 'text-emerald-600 dark:text-emerald-400', text: 'text-gray-800 dark:text-gray-200' },
  upcoming: { box: 'bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-700',             badge: '예정',    badgeColor: 'text-blue-600 dark:text-blue-400',         text: 'text-gray-800 dark:text-gray-200' },
  past:     { box: 'bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700',               badge: '종료',    badgeColor: 'text-gray-400 dark:text-gray-500',         text: 'text-gray-400 dark:text-gray-500' },
  none:     { box: 'bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700',               badge: '',        badgeColor: '',                                         text: 'text-gray-700 dark:text-gray-300' },
};

export default function UserExamInfoPage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('전체');
  const [showInterestModal, setShowInterestModal] = useState(false);

  // 내 시험 접수 정보
  const [applications, setApplications] = useState<UserExamApplication[]>([]);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [appModalEditing, setAppModalEditing] = useState<UserExamApplication | null>(null);
  const [appModalPrefill, setAppModalPrefill] = useState<ExamApplicationPrefill | null>(null);

  const userInterests = user?.interestedExamTypes ?? [];

  useEffect(() => {
    Promise.all([examInfoService.getMyExamInfo(), examApplicationService.getMine()])
      .then(([infoRes, appRes]) => {
        setItems(infoRes.data.data ?? []);
        setApplications(appRes.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const applicationsByExamInfoId = useMemo(() => {
    const map = new Map<number, UserExamApplication[]>();
    for (const app of applications) {
      if (app.examInfoId == null) continue;
      const list = map.get(app.examInfoId) ?? [];
      list.push(app);
      map.set(app.examInfoId, list);
    }
    return map;
  }, [applications]);

  const freeApplications = applications.filter(app => app.examInfoId == null);

  const openAddApplication = (item?: ExamInfo) => {
    setAppModalEditing(null);
    setAppModalPrefill(item ? { examInfoId: item.id, examName: item.title, examType: item.examType } : null);
    setAppModalOpen(true);
  };

  const openEditApplication = (app: UserExamApplication) => {
    setAppModalEditing(app);
    setAppModalPrefill(null);
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

  const openInterestModal = () => setShowInterestModal(true);

  const handleInterestsSaved = () => {
    setLoading(true);
    examInfoService.getMyExamInfo()
      .then(infoRes => setItems(infoRes.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const allTypes = ['전체', ...Array.from(new Set(items.map(i => i.examType)))];
  const displayed = filterType === '전체' ? items : items.filter(i => i.examType === filterType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">시험 정보</h2>
          {userInterests.length > 0 ? (
            <p className="text-sm text-gray-500 mt-1">
              관심 시험:&nbsp;
              {userInterests.map(t => (
                <span key={t} className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${examTypeColor(t)}`}>
                  {t}
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">전체 시험 정보를 표시합니다.</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openAddApplication()}
            title="목록에 없는 시험의 접수 정보를 직접 입력합니다"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            다른 시험 직접 등록
          </button>
          <button
            type="button"
            onClick={openInterestModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            관심 설정
          </button>
        </div>
      </div>

      {/* Type filter tabs */}
      {allTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {allTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <ExamInfoCardSkeleton count={3} />
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm mb-2">표시할 시험 정보가 없습니다.</p>
          {userInterests.length > 0 && (
            <button type="button" onClick={openInterestModal}
              className="text-indigo-500 text-sm hover:underline">
              관심 시험 유형을 변경해 보세요
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayed.map(item => {
            const myApps = applicationsByExamInfoId.get(item.id) ?? [];
            const myApplicationDate = myApps.find(a => a.applicationDate)?.applicationDate;
            const myExamDate = myApps.find(a => a.examDate)?.examDate;
            const appStatus = getPhaseStatus(myApplicationDate ?? item.applicationPeriod);
            const schStatus = getPhaseStatus(myExamDate ?? item.examSchedule);
            const resStatus = getPhaseStatus(item.resultDate);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${examTypeColor(item.examType)}`}>
                      {item.examType}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {item.officialUrl && (
                      <a
                        href={item.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      >
                        공식 홈페이지
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{item.description}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {item.applicationPeriod && (
                    <div className={`${PHASE_STYLES[appStatus].box} rounded-xl p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">접수 기간</p>
                        <div className="flex items-center gap-1.5">
                          {appStatus === 'active' && item.applicationUrl && (
                            <a
                              href={item.applicationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                            >
                              접수하기
                              <svg viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                              </svg>
                            </a>
                          )}
                          {PHASE_STYLES[appStatus].badge && (
                            <span className={`text-[9px] font-bold ${PHASE_STYLES[appStatus].badgeColor}`}>
                              {PHASE_STYLES[appStatus].badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${PHASE_STYLES[appStatus].text}`}>{fmtRange(item.applicationPeriod)}</p>
                    </div>
                  )}
                  {item.examSchedule && (
                    <div className={`${PHASE_STYLES[schStatus].box} rounded-xl p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">시험 일정</p>
                        {PHASE_STYLES[schStatus].badge && (
                          <span className={`text-[9px] font-bold ${PHASE_STYLES[schStatus].badgeColor}`}>
                            {PHASE_STYLES[schStatus].badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${PHASE_STYLES[schStatus].text}`}>{fmtRange(item.examSchedule)}</p>
                    </div>
                  )}
                  {item.resultDate && (
                    <div className={`${PHASE_STYLES[resStatus].box} rounded-xl p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">합격 발표</p>
                        {PHASE_STYLES[resStatus].badge && (
                          <span className={`text-[9px] font-bold ${PHASE_STYLES[resStatus].badgeColor}`}>
                            {PHASE_STYLES[resStatus].badge}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${PHASE_STYLES[resStatus].text}`}>{fmtRange(item.resultDate)}</p>
                    </div>
                  )}
                </div>

                {/* 내 접수 정보 미니 섹션 */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {(applicationsByExamInfoId.get(item.id) ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {(applicationsByExamInfoId.get(item.id) ?? []).map(app => {
                        const dDayLabel = getExamDDayLabel(app.applicationDate, app.examDate);
                        return (
                        <div key={app.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-xs text-gray-600 truncate flex items-center gap-1.5">
                            <span className="font-medium text-gray-700">내 접수</span>
                            {dDayLabel && (
                              <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${getExamDDayBadgeClass(app.applicationDate, app.examDate)}`}>
                                {dDayLabel}
                              </span>
                            )}
                            {app.applicationDate && <span className="ml-1">접수일 {app.applicationDate}</span>}
                            {app.examDate && <span className="ml-2">시험일 {app.examDate}</span>}
                            {app.memo && <span className="ml-2 text-gray-400">· {app.memo}</span>}
                          </p>
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
                      <button type="button" onClick={() => openAddApplication(item)}
                        className="text-xs text-indigo-500 hover:underline">
                        + 접수 정보 추가
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => openAddApplication(item)}
                      className="text-xs text-indigo-500 hover:underline">
                      + 접수 정보 입력
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 직접 등록한 시험 (exam_info와 연결되지 않은 자유 입력 접수 정보) */}
      {!loading && freeApplications.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">직접 등록한 시험</h3>
          <div className="grid gap-3">
            {freeApplications.map(app => (
              <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{app.examName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {app.applicationDate && <>접수일 {app.applicationDate}</>}
                    {app.applicationDate && app.examDate && ' · '}
                    {app.examDate && <>시험일 {app.examDate}</>}
                  </p>
                  {app.memo && <p className="text-xs text-gray-400 mt-1 truncate">{app.memo}</p>}
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
            ))}
          </div>
        </div>
      )}

      {/* 접수 정보 등록/수정 모달 */}
      {appModalOpen && (
        <ExamApplicationFormModal
          open={appModalOpen}
          onClose={() => setAppModalOpen(false)}
          onSaved={handleApplicationSaved}
          editing={appModalEditing}
          prefill={appModalPrefill}
        />
      )}

      {/* 관심 시험 유형 설정 모달 */}
      <InterestExamTypeModal
        open={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onSaved={handleInterestsSaved}
      />
    </div>
  );
}
