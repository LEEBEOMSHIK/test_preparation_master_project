'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateExpression, type EvalResult } from '@/lib/safeMathCalc';
import { parseTraceLines, sanitizeLegacyTraceBlocks, legacyTraceBlocksToNotation } from '@/lib/traceNotation';
import { TracePreview } from '@/components/ui/TracePreview';
import {
  PageReplacementTool,
  EMPTY_PAGE_REPLACEMENT_DATA,
  isPageReplacementData,
  type PageReplacementData,
} from '@/components/ui/PageReplacementTool';
import { BinaryTreeTool } from '@/components/ui/BinaryTreeTool';
import {
  SchedulingSolveTool,
  EMPTY_SCHEDULING_SOLVE_DATA,
  isSchedulingSolveData,
  type SchedulingSolveData,
} from '@/components/ui/SchedulingSolveTool';

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
  /**
   * 페이지 부재(페이지 교체) 풀이 도구 데이터. HIST-20260706-007에서 추가되었으며, 이전 저장분에는
   * 필드 자체가 없을 수 있어 loadData가 타입가드(isPageReplacementData)로 검증 후 없거나 손상된
   * 경우 EMPTY_PAGE_REPLACEMENT_DATA로 폴백한다.
   */
  pageReplacement: PageReplacementData;
  /**
   * 이진트리 시각화 도구(BinaryTreeTool)의 레벨오더 배열 표기 입력 원본 문자열.
   * HIST-20260707-003에서 추가. 구버전 저장분에는 필드 자체가 없을 수 있어 loadData가
   * 문자열 타입가드로 검증 후 없거나 손상된 경우 빈 문자열로 폴백한다.
   */
  treeInput: string;
  /**
   * 손입력 간트 차트 CPU 스케줄링 풀이 도구(SchedulingSolveTool) 데이터. HIST-20260710-002에서
   * 추가되었으며, 이전 저장분에는 필드 자체가 없을 수 있어 loadData가 타입가드
   * (isSchedulingSolveData)로 검증 후 없거나 손상된 경우 EMPTY_SCHEDULING_SOLVE_DATA로 폴백한다.
   */
  scheduling: SchedulingSolveData;
  /**
   * @deprecated HIST-20260706-001에서 도입된 클릭식 블록 위젯(변수 워치·1D/2D 배열·반복 스텝 표)의
   * 저장 필드. HIST-20260706-002부터 "타이핑→자동 렌더" 표기법(trace 텍스트 파싱)으로 대체되어
   * 더 이상 생성·저장하지 않는다. loadData가 구버전 저장분을 만나면 표기법 텍스트로 1회 이관 후
   * 폐기하므로, 이 필드는 구 payload 안전 파싱(하위호환) 용도로만 타입에 남긴다.
   */
  traceBlocks?: unknown;
}

const EMPTY_DATA: ScratchPadData = {
  note: '',
  trace: '',
  calcHistory: [],
  pageReplacement: EMPTY_PAGE_REPLACEMENT_DATA,
  treeInput: '',
  scheduling: EMPTY_SCHEDULING_SOLVE_DATA,
};
const SAVE_DEBOUNCE_MS = 500;
const MAX_CALC_HISTORY = 5;

const PANEL_WIDTH_STORAGE_KEY = 'tpmp:scratchpad:panel-width';
const DEFAULT_PANEL_WIDTH = 320;
const MIN_PANEL_WIDTH = 300;

type TabKey = 'note' | 'trace' | 'pagereplace' | 'scheduling' | 'tree' | 'calc';

function formatCalcValue(result: EvalResult): string {
  if ('error' in result) return result.error;
  if (!result.bitwise) return String(result.value);
  return `${result.value} (${result.bitwise.binary}, ${result.bitwise.hex})`;
}

/** 드로어 폭을 [MIN_PANEL_WIDTH, max] 범위로 clamp */
function clampPanelWidth(width: number, max: number): number {
  return Math.min(Math.max(width, MIN_PANEL_WIDTH), max);
}

/** 리사이즈 가능한 최대 폭 — 뷰포트 폭의 90% 또는 720px 중 작은 값 */
function computeMaxPanelWidth(): number {
  if (typeof window === 'undefined') return 720;
  return Math.min(720, window.innerWidth * 0.9);
}

/**
 * localStorage에서 데스크톱 드로어 폭 복원 — 파싱 실패/미존재/SSR 접근 오류 시 기본값으로 폴백.
 * 복원 즉시 현재 뷰포트 기준 범위로 clamp해 비정상적으로 넓은/좁은 값이 남지 않게 한다.
 */
function loadPanelWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_PANEL_WIDTH;
  try {
    const raw = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
    if (!raw) return DEFAULT_PANEL_WIDTH;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DEFAULT_PANEL_WIDTH;
    return clampPanelWidth(parsed, computeMaxPanelWidth());
  } catch {
    return DEFAULT_PANEL_WIDTH;
  }
}

/** 드로어 폭을 localStorage에 저장 — 접근 오류(시크릿모드 용량 제한 등)는 무시 */
function savePanelWidth(width: number): void {
  try {
    localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(Math.round(width)));
  } catch {
    // 저장 실패 — 무시
  }
}

/**
 * localStorage에서 스크래치패드 데이터 로드 — 파싱/접근 오류 시 빈 데이터로 폴백.
 * 구버전(HIST-20260706-001) traceBlocks가 남아있으면 표기법 텍스트로 1회 변환해
 * trace 끝에 합치고, 이후로는 traceBlocks 필드를 저장하지 않는다(데이터 손실 없는 이관).
 */
function loadData(key: string): ScratchPadData {
  if (typeof window === 'undefined') return EMPTY_DATA;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_DATA;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      typeof (parsed as ScratchPadData).note !== 'string' ||
      typeof (parsed as ScratchPadData).trace !== 'string' ||
      !Array.isArray((parsed as ScratchPadData).calcHistory)
    ) {
      return EMPTY_DATA;
    }

    const p = parsed as ScratchPadData;
    const pageReplacement = isPageReplacementData(p.pageReplacement) ? p.pageReplacement : EMPTY_PAGE_REPLACEMENT_DATA;
    const treeInput = typeof p.treeInput === 'string' ? p.treeInput : '';
    const scheduling = isSchedulingSolveData(p.scheduling) ? p.scheduling : EMPTY_SCHEDULING_SOLVE_DATA;

    const legacyBlocks = sanitizeLegacyTraceBlocks(p.traceBlocks);
    if (legacyBlocks.length === 0) {
      return { note: p.note, trace: p.trace, calcHistory: p.calcHistory, pageReplacement, treeInput, scheduling };
    }
    const migratedText = legacyTraceBlocksToNotation(legacyBlocks);
    const mergedTrace = [p.trace, migratedText].filter(s => s.trim().length > 0).join('\n');
    return { note: p.note, trace: mergedTrace, calcHistory: p.calcHistory, pageReplacement, treeInput, scheduling };
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
 * 자유 메모 · (CODE 문항 한정) 코드 트레이싱 · 페이지 부재(페이지 교체) 풀이 도구 · 스케줄링(간트 차트)
 * 풀이 도구 · 트리 시각화 · 안전 계산기 6탭으로 구성되며 storageKey 단위로 localStorage에
 * 자동 저장(디바운스)된다. BE/DB 연동 없음.
 * 페이지 부재 탭은 참조열/프레임 수로 표 골격만 생성하고 알고리즘 자동 계산은 하지 않는다(순수 입력 보조).
 * 스케줄링 탭은 프로세스 표/총 시간으로 간트 차트·결과 표 골격만 생성하고 FIFO/SJF/RR/Priority 등
 * 알고리즘 자동 계산·채점은 하지 않는다(반환/대기시간 평균만 자동 계산).
 * 트리 탭은 레벨오더 배열 표기(`[1, 2, 3, null, 4, 5]`)를 입력하면 BinaryTreeTool이 LeetCode
 * 표준 규칙으로 역직렬화 후 SVG로 자동 렌더한다(순수 시각화, 채점/코드실행 없음).
 * 코드 트레이싱 탭은 "타이핑→자동 렌더" 방식이다. textarea에 `이름 = 값` 표기법으로
 * 한 줄씩 입력하면 @/lib/traceNotation의 순수 파서가 변수/1D 배열/2D 배열/자유
 * 텍스트로 실시간 분류하고, TracePreview가 이를 시각화한다. 코드 실행/eval은 하지 않는다.
 *
 * 데스크톱(lg↑): 우측 비모달 슬라이드 드로어
 * 모바일(lg 미만): 기존 답안 Bottom Sheet 컨벤션 재사용(딤 배경 + rounded-t-2xl)
 */
export function ScratchPadPanel({ storageKey, isCodeQuestion = false, className = '' }: ScratchPadPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('note');
  const [data, setData] = useState<ScratchPadData>(() => loadData(storageKey));

  // 데스크톱 드로어 폭(px) — localStorage에 영속, 왼쪽 핸들 드래그로 리사이즈
  const [panelWidth, setPanelWidth] = useState<number>(() => loadPanelWidth());
  // 드래그 진행 중 시작 X좌표/시작 폭/최대 폭 — mousemove/mouseup 리스너에서 참조(리렌더와 무관)
  const resizeRef = useRef<{ startX: number; startWidth: number; max: number } | null>(null);

  // 계산기 입력/결과 — 저장 대상 아님(계산 기록만 calcHistory에 누적)
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState<EvalResult | null>(null);

  // 코드 트레이싱 프리뷰 — trace 텍스트가 바뀔 때만 재파싱(순수 함수, 실행/eval 없음)
  const traceLines = useMemo(() => parseTraceLines(data.trace), [data.trace]);

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

  // 드로어 폭 리사이즈 — 드래그 중 폭 갱신(왼쪽으로 끌수록 폭 증가)
  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    const state = resizeRef.current;
    if (!state) return;
    const next = clampPanelWidth(state.startWidth + (state.startX - e.clientX), state.max);
    setPanelWidth(next);
  }, []);

  // 드래그 종료 — 리스너 해제 + body 커서/선택 원복 + 최종 폭 저장
  const handleResizeMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    resizeRef.current = null;
    setPanelWidth(prev => {
      savePanelWidth(prev);
      return prev;
    });
  }, [handleResizeMouseMove]);

  // 리사이즈 핸들 mousedown — 시작 좌표/폭/최대치 기록 후 document에 드래그 리스너 등록
  const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startWidth: panelWidth, max: computeMaxPanelWidth() };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  }, [panelWidth, handleResizeMouseMove, handleResizeMouseUp]);

  // 언마운트 시 드래그 도중이었다면 리스너/body 스타일 잔류 없이 정리(누수 방지)
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [handleResizeMouseMove, handleResizeMouseUp]);

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
      const entry = `${calcInput.trim()} = ${formatCalcValue(result)}`;
      updateData(prev => ({ ...prev, calcHistory: [entry, ...prev.calcHistory].slice(0, MAX_CALC_HISTORY) }));
    }
  }, [calcInput, updateData]);

  const clearCalcHistory = useCallback(() => {
    updateData(prev => ({ ...prev, calcHistory: [] }));
  }, [updateData]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'note', label: '자유 메모' },
    ...(isCodeQuestion ? [{ key: 'trace' as TabKey, label: '코드 트레이싱' }] : []),
    { key: 'pagereplace', label: '페이지 부재' },
    { key: 'scheduling', label: '스케줄링' },
    { key: 'tree', label: '트리' },
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
          <div className="flex flex-col gap-3">
            {/* 표기법 입력 — 타이핑만으로 아래 프리뷰가 자동 렌더됨(코드 실행/eval 없음) */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                한 줄에 하나씩 입력하세요 — <span className="font-mono">i = 3</span> ·{' '}
                <span className="font-mono">arr = [1, 2, 3]</span> ·{' '}
                <span className="font-mono">grid = [[1,2],[3,4]]</span> ·{' '}
                <span className="font-mono">x: long = 3</span>(타입 명시) ·{' '}
                <span className="font-mono">avg = sum / len</span>(정의 순서 무관 숫자 변수 참조·리터럴 수식 자동 계산) ·{' '}
                <span className="font-mono">mask = 0b1010 & 0b0110</span>(비트 계산) ·{' '}
                <span className="font-mono">av / len</span>(이름 없이 수식만 적어도 자동 계산, 예: <span className="font-mono">10 / 4</span>)
              </p>
              <textarea
                value={data.trace}
                onChange={e => updateData(prev => ({ ...prev, trace: e.target.value }))}
                onKeyDown={handleTraceKeyDown}
                placeholder={
                  'i = 3\nx: long = 3\nsum = 10\nlen = 4\navg = sum / len\nmask = 0b1010 & 0b0110\nmask << 1\narr = [1, 2, 3]\ngrid = [[1, 2], [3, 4]]\n표기법이 아니어도 자유 메모로 그대로 남습니다.'
                }
                spellCheck={false}
                className="w-full h-40 resize-y rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-mono p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* 자동 렌더 프리뷰 — trace 텍스트를 파싱해 변수/배열을 실시간 시각화(클릭 편집 없음) */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">자동 렌더 프리뷰</p>
              <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-2.5">
                <TracePreview lines={traceLines} />
              </div>
            </div>
          </div>
        )}

        {tab === 'pagereplace' && (
          <PageReplacementTool
            value={data.pageReplacement}
            onChange={next => updateData(prev => ({ ...prev, pageReplacement: next }))}
          />
        )}

        {tab === 'scheduling' && (
          <SchedulingSolveTool
            value={data.scheduling}
            onChange={next => updateData(prev => ({ ...prev, scheduling: next }))}
          />
        )}

        {tab === 'tree' && (
          <BinaryTreeTool
            value={data.treeInput}
            onChange={next => updateData(prev => ({ ...prev, treeInput: next }))}
          />
        )}

        {tab === 'calc' && (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={calcInput}
                onChange={e => setCalcInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runCalc()}
                placeholder="예: (0b1010 & 0b0110) << 1"
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
                {'value' in calcResult ? (
                  <div className="flex flex-col gap-1">
                    <span>= {calcResult.value}</span>
                    {calcResult.bitwise && (
                      <span className="text-xs opacity-80 break-all">
                        bin32 {calcResult.bitwise.binary} · hex32 {calcResult.bitwise.hex}
                      </span>
                    )}
                  </div>
                ) : calcResult.error}
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
          {/* 데스크톱: 우측 비모달 슬라이드 드로어 (딤 배경 없음)
              z-30: 레이아웃 헤더(z-40)의 로그아웃/네비 드롭다운이 드로어에 가리지 않도록 헤더보다 낮게 유지 */}
          <div
            className="hidden lg:flex fixed right-0 top-14 h-[calc(100vh-3.5rem)] z-30 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl flex-col"
            style={{ width: panelWidth }}
          >
            {/* 리사이즈 핸들 — 왼쪽 가장자리를 좌우로 드래그해 드로어 폭 조절(localStorage 영속) */}
            <div
              onMouseDown={handleResizeMouseDown}
              className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-colors z-10"
              aria-hidden="true"
            />
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
