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

type ExamTypeTheme = {
  badge: string;
  activeTab: string;
  inactiveTab: string;
};

// 완전한 클래스 문자열을 유지해 Tailwind 정적 스캔이 모든 light/dark 상태를 생성하게 한다.
const EXAM_TYPE_THEMES: readonly ExamTypeTheme[] = [
  {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200',
    activeTab: 'border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700 dark:border-blue-400 dark:bg-blue-500 dark:text-white dark:hover:border-blue-300 dark:hover:bg-blue-400',
    inactiveTab: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/80',
  },
  {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
    activeTab: 'border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700 dark:border-emerald-400 dark:bg-emerald-500 dark:text-white dark:hover:border-emerald-300 dark:hover:bg-emerald-400',
    inactiveTab: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/80',
  },
  {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    activeTab: 'border-amber-600 bg-amber-600 text-white hover:border-amber-700 hover:bg-amber-700 dark:border-amber-400 dark:bg-amber-500 dark:text-gray-950 dark:hover:border-amber-300 dark:hover:bg-amber-400',
    inactiveTab: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:border-amber-500 dark:hover:bg-amber-900/80',
  },
  {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200',
    activeTab: 'border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700 dark:border-red-400 dark:bg-red-500 dark:text-white dark:hover:border-red-300 dark:hover:bg-red-400',
    inactiveTab: 'border-red-200 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-900/80',
  },
  {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200',
    activeTab: 'border-violet-600 bg-violet-600 text-white hover:border-violet-700 hover:bg-violet-700 dark:border-violet-400 dark:bg-violet-500 dark:text-white dark:hover:border-violet-300 dark:hover:bg-violet-400',
    inactiveTab: 'border-violet-200 bg-violet-50 text-violet-700 hover:border-violet-400 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:border-violet-500 dark:hover:bg-violet-900/80',
  },
  {
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-200',
    activeTab: 'border-pink-600 bg-pink-600 text-white hover:border-pink-700 hover:bg-pink-700 dark:border-pink-400 dark:bg-pink-500 dark:text-white dark:hover:border-pink-300 dark:hover:bg-pink-400',
    inactiveTab: 'border-pink-200 bg-pink-50 text-pink-700 hover:border-pink-400 hover:bg-pink-100 dark:border-pink-800 dark:bg-pink-950/40 dark:text-pink-300 dark:hover:border-pink-500 dark:hover:bg-pink-900/80',
  },
  {
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200',
    activeTab: 'border-teal-600 bg-teal-600 text-white hover:border-teal-700 hover:bg-teal-700 dark:border-teal-400 dark:bg-teal-500 dark:text-white dark:hover:border-teal-300 dark:hover:bg-teal-400',
    inactiveTab: 'border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-400 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 dark:hover:border-teal-500 dark:hover:bg-teal-900/80',
  },
  {
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-200',
    activeTab: 'border-orange-600 bg-orange-600 text-white hover:border-orange-700 hover:bg-orange-700 dark:border-orange-400 dark:bg-orange-500 dark:text-gray-950 dark:hover:border-orange-300 dark:hover:bg-orange-400',
    inactiveTab: 'border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:border-orange-500 dark:hover:bg-orange-900/80',
  },
  {
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200',
    activeTab: 'border-cyan-600 bg-cyan-600 text-white hover:border-cyan-700 hover:bg-cyan-700 dark:border-cyan-400 dark:bg-cyan-500 dark:text-gray-950 dark:hover:border-cyan-300 dark:hover:bg-cyan-400',
    inactiveTab: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:border-cyan-500 dark:hover:bg-cyan-900/80',
  },
  {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900/60 dark:text-lime-200',
    activeTab: 'border-lime-600 bg-lime-600 text-white hover:border-lime-700 hover:bg-lime-700 dark:border-lime-400 dark:bg-lime-500 dark:text-gray-950 dark:hover:border-lime-300 dark:hover:bg-lime-400',
    inactiveTab: 'border-lime-200 bg-lime-50 text-lime-800 hover:border-lime-400 hover:bg-lime-100 dark:border-lime-800 dark:bg-lime-950/40 dark:text-lime-300 dark:hover:border-lime-500 dark:hover:bg-lime-900/80',
  },
  {
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
    activeTab: 'border-rose-600 bg-rose-600 text-white hover:border-rose-700 hover:bg-rose-700 dark:border-rose-400 dark:bg-rose-500 dark:text-white dark:hover:border-rose-300 dark:hover:bg-rose-400',
    inactiveTab: 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:border-rose-500 dark:hover:bg-rose-900/80',
  },
  {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200',
    activeTab: 'border-sky-600 bg-sky-600 text-white hover:border-sky-700 hover:bg-sky-700 dark:border-sky-400 dark:bg-sky-500 dark:text-white dark:hover:border-sky-300 dark:hover:bg-sky-400',
    inactiveTab: 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-500 dark:hover:bg-sky-900/80',
  },
];

const DEFAULT_EXAM_TYPE_THEME = EXAM_TYPE_THEMES[0];
const EMPTY_EXAM_TYPES: string[] = [];

/** 제목 끝의 "N차"(1차/2차/…)를 분리하는 패턴 — 회차 그룹핑·세션 배지 표시에 공용 사용 */
const SESSION_SUFFIX_RE = /^(.+)\s(\d차)$/;

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

  const userInterests = user?.interestedExamTypes ?? EMPTY_EXAM_TYPES;

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

  // 탭 목록은 관심 시험 유형 기준으로 만든다 — 관심 유형에 아직 등록된 시험 정보가 없어도
  // (예: exam_info 데이터 누락) 탭 자체가 사라지지 않고 "표시할 시험 정보가 없습니다" 빈 상태로 안내한다.
  const itemTypes = useMemo(() => Array.from(new Set(items.map(i => i.examType))), [items]);
  const allTypes = useMemo(() => {
    const baseTypes = userInterests.length > 0 ? userInterests : itemTypes;
    return ['전체', ...Array.from(new Set([...baseTypes, ...itemTypes]))];
  }, [itemTypes, userInterests]);
  const examTypeThemeMap = useMemo(() => {
    const themes = new Map<string, ExamTypeTheme>();
    allTypes.filter(type => type !== '전체').forEach((type, index) => {
      themes.set(type, EXAM_TYPE_THEMES[index % EXAM_TYPE_THEMES.length]);
    });
    return themes;
  }, [allTypes]);
  const getExamTypeTheme = (type: string) => examTypeThemeMap.get(type) ?? DEFAULT_EXAM_TYPE_THEME;
  const displayed = filterType === '전체' ? items : items.filter(i => i.examType === filterType);

  // 리눅스마스터처럼 같은 회차 안에 1차/2차가 나뉜 시험은 제목 끝의 "N차"를 떼어낸
  // 나머지를 그룹 키로 묶어 하나의 카드 안에서 함께 보여준다(관계를 한눈에 파악하기 위함).
  // 1차/2차 구분이 없는 시험(SQLD·정보처리기사 등)은 자연히 항목이 1개인 그룹이 되어
  // 기존과 동일한 단일 카드로 렌더링된다.
  const sessionGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, ExamInfo[]>();
    for (const item of displayed) {
      const m = item.title.match(SESSION_SUFFIX_RE);
      const key = `${item.examType}::${m ? m[1] : item.title}`;
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key)!.push(item);
    }
    return order.map(key => {
      const groupItems = map.get(key)!;
      const m = groupItems[0].title.match(SESSION_SUFFIX_RE);
      return { key, baseTitle: m ? m[1] : groupItems[0].title, items: groupItems };
    });
  }, [displayed]);

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
                <span key={t} className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mr-1 ${getExamTypeTheme(t).badge}`}>
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
          {allTypes.map(type => {
            const isActive = filterType === type;
            const tabTheme = type === '전체' ? null : getExamTypeTheme(type);
            const stateClass = tabTheme
              ? (isActive ? tabTheme.activeTab : tabTheme.inactiveTab)
              : (isActive
                ? 'border-indigo-600 bg-indigo-600 text-white hover:border-indigo-700 hover:bg-indigo-700 dark:border-indigo-400 dark:bg-indigo-500 dark:text-white dark:hover:border-indigo-300 dark:hover:bg-indigo-400'
                : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700');
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`border px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${stateClass}`}
              >
                {type}
              </button>
            );
          })}
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
          {sessionGroups.map(group => {
            const first = group.items[0];
            const isGrouped = group.items.length > 1;

            const renderSessionBody = (item: ExamInfo) => {
              const myApps = applicationsByExamInfoId.get(item.id) ?? [];
              const myApplicationDate = myApps.find(a => a.applicationDate)?.applicationDate;
              const myExamDate = myApps.find(a => a.examDate)?.examDate;
              const appStatus = getPhaseStatus(myApplicationDate ?? item.applicationPeriod);
              const schStatus = getPhaseStatus(myExamDate ?? item.examSchedule);
              const resStatus = getPhaseStatus(item.resultDate);
              return (
                <>
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
                    {myApps.length > 0 ? (
                      <div className="space-y-2">
                        {myApps.map(app => {
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
                </>
              );
            };

            return (
              <div key={group.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getExamTypeTheme(first.examType).badge}`}>
                      {first.examType}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">{group.baseTitle}</h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {first.officialUrl && (
                      <a
                        href={first.officialUrl}
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

                {isGrouped ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.items.map(item => {
                      const m = item.title.match(SESSION_SUFFIX_RE);
                      const sessionLabel = m ? m[2] : null;
                      return (
                        <div key={item.id} className="bg-gray-50/60 rounded-xl border border-gray-100 p-3">
                          {sessionLabel && (
                            <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600">
                              {sessionLabel}
                            </span>
                          )}
                          {renderSessionBody(item)}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  renderSessionBody(first)
                )}
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
