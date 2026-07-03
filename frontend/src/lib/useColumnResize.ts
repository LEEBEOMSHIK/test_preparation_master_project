'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 테이블 컬럼 드래그 리사이즈 훅.
 *
 * @param storageKey   - localStorage 저장 키 (예: 'tpmp:admin-questions:col-widths')
 * @param defaultWidths - 컬럼 기본 너비(px) 배열. localStorage 값이 없거나 길이 불일치 시 사용.
 * @returns widths     - 현재 컬럼 너비 배열
 * @returns startResize - th 핸들 mouseDown 이벤트 핸들러 팩토리 (index, e) => void
 */
export function useColumnResize(
  storageKey: string,
  defaultWidths: number[],
): {
  widths: number[];
  startResize: (index: number, e: React.MouseEvent) => void;
} {
  const [widths, setWidths] = useState<number[]>(() => {
    // SSR 환경 안전 체크
    if (typeof window === 'undefined') return defaultWidths;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (
          Array.isArray(parsed) &&
          parsed.length === defaultWidths.length &&
          (parsed as unknown[]).every((v) => typeof v === 'number')
        ) {
          return parsed as number[];
        }
      }
    } catch {
      // JSON 파싱 오류 또는 localStorage 접근 오류 — 기본값으로 폴백
    }
    return defaultWidths;
  });

  // 드래그 중 최신 widths를 동기적으로 읽기 위한 ref
  const widthsRef = useRef<number[]>(widths);
  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  // 진행 중인 드래그 정리 함수를 보관 — 언마운트 시 잔여 리스너 제거
  const activeCleanupRef = useRef<(() => void) | null>(null);

  // 언마운트 cleanup: 드래그 중 컴포넌트가 제거될 때 리스너·스타일 원복
  useEffect(() => {
    return () => {
      activeCleanupRef.current?.();
    };
  }, []);

  const startResize = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();

      const startX = e.clientX;
      const startWidth = widthsRef.current[index] ?? defaultWidths[index] ?? 100;

      // 드래그 중 텍스트 선택 방지
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(40, startWidth + delta);
        setWidths((prev) => {
          const next = [...prev];
          next[index] = newWidth;
          return next;
        });
      };

      // 스타일 복원 + 리스너 제거 공통 함수 (정상 mouseup / 언마운트 양쪽에서 사용)
      const removeListeners = () => {
        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp); // onMouseUp은 아래에서 선언
        activeCleanupRef.current = null;
      };

      const onMouseUp = () => {
        removeListeners();

        // 드래그 종료 후 최신 widths를 localStorage에 저장
        try {
          localStorage.setItem(storageKey, JSON.stringify(widthsRef.current));
        } catch {
          // localStorage 쓰기 실패 — 무시
        }
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      // 언마운트 시 정리할 수 있도록 현재 드래그 cleanup 등록
      activeCleanupRef.current = removeListeners;
    },
    // defaultWidths는 외부에서 리터럴 배열로 전달되므로 storageKey만 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey],
  );

  return { widths, startResize };
}
