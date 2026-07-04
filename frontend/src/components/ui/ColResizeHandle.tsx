'use client';

import React from 'react';

/**
 * ColResizeHandle — th 내부 드래그 리사이즈 핸들
 *
 * 얇은 선(1px) + 8px 히트영역 중첩 구조.
 * 바깥 span: 투명 히트영역(w-2, cursor-col-resize),
 * 안쪽 span: 시각적 구분선(w-px, group-hover 시 indigo 강조).
 */
export function ColResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      onMouseDown={onMouseDown}
      className="group absolute top-0 -right-1 h-full w-2 cursor-col-resize select-none flex justify-center"
    >
      <span className="w-px h-full bg-gray-300 group-hover:bg-indigo-400 transition-colors dark:bg-gray-600 dark:group-hover:bg-indigo-500" />
    </span>
  );
}
