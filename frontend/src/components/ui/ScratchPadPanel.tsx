'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { evaluateExpression, type EvalResult } from '@/lib/safeMathCalc';

interface ScratchPadPanelProps {
  /** localStorage 저장 키 (문항 단위로 유일해야 함, 예: tpmp_scratchpad:exam:1:23) */
  storageKey: string;
  /** true면 '코드 트레이싱' 탭을 노출 */
  isCodeQuestion?: boolean;
  className?: string;
}

interface ScratchPadData {
  note: string;
  trace: string;
  calcHistory: string[];
}

const EMPTY_DATA: ScratchPadData = { note: '', trace: '', calcHistory: [] };
const SAVE_DEBOUNCE_MS = 500;
const MAX_CALC_HISTORY = 5;

type TabKey = 'note' | 'trace' | 'calc';

/** localStorage에서 스크래치패드 데이터 로드 — 파싱/접근 오류 시 빈 데이터로 폴백 */
function loadData(key: string): ScratchPadData {
  if (typeof window === 'undefined') return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_DATA;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      typeof (parsed as ScratchPadData).note === 'string' &&
      typeof (parsed as ScratchPadData).trace === 'string' &&
      Array.isArray((parsed as ScratchPadData).calcHistory)
    ) {
      return parsed as ScratchPadData;
    }
    return EMPTY_DATA;
  } catch {
    return EMPTY_DATA;
  }
}

/** localStorage에 저장 — 접근 오류(시크릿모드 용량 제한 등)는 무시 */
function saveData(key: string, data: ScratchPadData): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 저장 실패 — 무시
  }
}

/**
 * 풀이 스크래치패드 — 시험/퀴즈 풀이 화면 우하단 FAB로 여는 보조 메모 패널.
 * 자유 메모 · (CODE 문항 한정) 코드 트레이싱 · 안전 계산기 3탭으로 구성되며
 * storageKey 단위로 localStorage에 자동 저장(디바운스)된다. BE/DB 연동 없음.
 *
 * 데스크톱(lg↑): 우측 비모달 슬라이드 드로어
 * 모바일(lg 미만): 기존 답안 Bottom Sheet 컨벤션 재사용(딤 배경 + rounded-t-2xl)
 */
export function ScratchPadPanel({ storageKey, isCodeQuestion = false, className = '' }: ScratchPadPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('note');
  const [data, setData] = useState<ScratchPadData>(() => loadData(storageKey));

  // 계산기 입력/결과 — 저장 대상 아님(계산 기록만 calcHistory에 누적)
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<EvalResult | null>(null);

  // 디바운스 저장 타이머 + 미저장(pending) 데이터 — storageKey 전환 시 flush용
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ key: string; data: ScratchPadData } | null>(null);
  const prevKeyRef = useRef(storageKey);

  const flushPending = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingRef.current) {
      saveData(pendingRef.current.key, pendingRef.current.data);
      pendingRef.current = null;
    }
  }, []);

  // storageKey 변경 시: 이전 키의 미저장 변경분을 먼저 flush한 뒤 새 키 데이터를 로드.
  // 패널 open 상태·tab 선택은 유지(리마운트 아님).
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      flushPending();
      prevKeyRef.current = storageKey;
    }
    setData(loadData(storageKey));
    setCalcInput('');
    setCalcResult(null);
  }, [storageKey, flushPending]);

  // CODE 문항이 아닌 화면으로 전환됐는데 코드 트레이싱 탭이 선택돼 있으면 자유 메모로 복귀
  useEffect(() => {
    if (!isCodeQuestion && tab === 'trace') setTab('note');
  }, [isCodeQuestion, tab]);

  // 언마운트 시 잔여 저장 flush
  useEffect(() => () => flushPending(), [flushPending]);

  // ESC로 패널 닫기 (데스크톱 드로어·모바일 시트 공통)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const scheduleSave = useCallback((key: string, next: ScratchPadData) => {
    pendingRef.current = { key, data: next };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveData(key, next);
      pendingRef.current = null;
      saveTimerRef.current = null;
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const updateData = useCallback((updater: (prev: ScratchPadData) => ScratchPadData) => {
    setData(prev => {
      const next = updater(prev);
      scheduleSave(storageKey, next);
      return next;
    });
  }, [storageKey, scheduleSave]);

  const handleTraceKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    updateData(prev => ({ ...prev, trace: prev.trace.slice(0, start) + '  ' + prev.trace.slice(end) }));
    // 상태 반영 후 커서 위치 복원
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + 2;
    });
  };

  const runCalc = useCallback(() => {
    const result = evaluateExpression(calcInput);
    setCalcResult(result);
    if ('value' in result) {
      const entry = `${calcInput.trim()} = ${result.value}`;
      updateData(prev => ({ ...prev, calcHistory: [entry, ...prev.calcHistory].slice(0, MAX_CALC_HISTORY) }));
    }
  }, [calcInput, updateData]);

  const clearCalcHistory = useCallback(() => {
    updateData(prev => ({ ...prev, calcHistory: [] }));
  }, [updateData]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'note', label: '자유 메모' },
    ...(isCodeQuestion ? [{ key: 'trace' as TabKey, label: '코드 트레이싱' }] : []),
    { key: 'calc', label: '계산기' },
  ];

  // ── 패널 내용(헤더 + 탭 + 본문) — 드로어/시트 공용 ──────────────────────────
  const panelContent = (
    <div className="flex flex-col h-full min-h-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">풀이 스크래치패드</h2>
        <button
          onClick={() => setOpen(false)}
          aria-label="닫기"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 px-3 pt-2.5 shrink-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'px-2.5 py-1.5 rounded-lg text-xs font-medium transition',
              tab === t.key
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 본문 */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto">
        {tab === 'note' && (
          <textarea
            value={data.note}
            onChange={e => updateData(prev => ({ ...prev, note: e.target.value }))}
            placeholder="자유롭게 메모하세요..."
            className="w-full h-full min-h-[240px] resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        {tab === 'trace' && isCodeQuestion && (
          <textarea
            value={data.trace}
            onChange={e => updateData(prev => ({ ...prev, trace: e.target.value }))}
            onKeyDown={handleTraceKeyDown}
            placeholder="변수 값 변화, 실행 흐름 등을 트레이싱하세요... (Tab: 들여쓰기)"
            spellCheck={false}
            className="w-full h-full min-h-[240px] resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-mono p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        {tab === 'calc' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={calcInput}
                onChange={e => setCalcInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runCalc()}
                placeholder="예: (12 + 8) * 3 % 7"
                className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={runCalc}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shrink-0"
              >
                계산
              </button>
            </div>

            {calcResult && (
              <div
                className={[
                  'rounded-lg px-3 py-2 text-sm font-mono',
                  'value' in calcResult
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
                ].join(' ')}
              >
                {'value' in calcResult ? `= ${calcResult.value}` : calcResult.error}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">최근 계산</p>
                {data.calcHistory.length > 0 && (
                  <button
                    onClick={clearCalcHistory}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                  >
                    기록 지우기
                  </button>
                )}
              </div>
              {data.calcHistory.length === 0 ? (
                <p className="text-xs text-gray-300 dark:text-gray-600">계산 기록이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {data.calcHistory.map((entry, idx) => (
                    <li
                      key={idx}
                      className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-md px-2.5 py-1.5"
                    >
                      {entry}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* FAB — 패널이 열려있는 동안은 숨김(닫기는 패널 헤더의 X로) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="풀이 스크래치패드 열기"
          className={`fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition ${className}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.75L17.25 9" />
          </svg>
        </button>
      )}

      {open && (
        <>
          {/* 데스크톱: 우측 비모달 슬라이드 드로어 (딤 배경 없음) */}
          <div className="hidden lg:flex fixed right-0 top-14 w-80 h-[calc(100vh-3.5rem)] z-40 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex-col">
            {panelContent}
          </div>

          {/* 모바일: 기존 답안 Bottom Sheet 컨벤션 재사용 */}
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
              {panelContent}
            </div>
          </div>
        </>
      )}
    </>
  );
}
