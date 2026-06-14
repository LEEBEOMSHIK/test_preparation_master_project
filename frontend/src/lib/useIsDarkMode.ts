import { useEffect, useState } from 'react';

/**
 * 현재 다크모드 적용 여부를 document.documentElement의 'dark' 클래스
 * (ThemeProvider가 설정하는 단일 진실 소스)에서 직접 읽어 반환한다.
 *
 * - 클래스 변경을 MutationObserver로 감지하므로 테마 토글·시스템 설정 변경 모두에 반응한다.
 * - 렌더 시점에 window.matchMedia를 평가하지 않아 SSR/하이드레이션 불일치가 없다.
 *   (초기값 false → 마운트 후 실제 클래스로 동기화)
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
