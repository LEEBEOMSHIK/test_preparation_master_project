import { render, screen, waitFor } from '@testing-library/react';
import { useLayoutEffect } from 'react';

import { RichContent } from './RichContent';

interface HarnessProps {
  html: string;
  onLayout: () => void;
}

function RichContentHarness({ html, onLayout }: HarnessProps) {
  useLayoutEffect(onLayout, [html, onLayout]);
  return <div data-testid="rich-content-harness"><RichContent html={html} /></div>;
}

describe('RichContent', () => {
  it('악성 스크립트와 이벤트 속성을 제거한다', async () => {
    const { container } = render(
      <RichContent html={'<p>안전한 본문</p><script>window.__xss = true</script><img src="x" onerror="window.__xss = true" />'} />,
    );

    await waitFor(() => {
      expect(container.querySelector('script')).toBe(null);
      expect(container.querySelector('img')?.getAttribute('onerror')).toBe(null);
    });
  });

  it('안전한 서식은 유지한다', async () => {
    render(<RichContent html={'<h2>업데이트</h2><p><strong>중요</strong> 안내입니다.</p><ul><li>항목</li></ul>'} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '업데이트' }).tagName).toBe('H2');
      expect(screen.getByText('중요').tagName).toBe('STRONG');
      expect(screen.getByText('항목').tagName).toBe('LI');
    });
  });

  it('html prop 교체 직후에는 이전 정제 본문을 렌더링하지 않는다', async () => {
    let contentDuringLayout = '';
    const captureLayout = () => {
      contentDuringLayout = screen.queryByTestId('rich-content-harness')?.textContent ?? '';
    };
    const { rerender } = render(
      <RichContentHarness html="<p>이전 본문</p>" onLayout={captureLayout} />,
    );
    expect((await screen.findByText('이전 본문')).textContent).toBe('이전 본문');

    rerender(<RichContentHarness html="<p>새 본문</p>" onLayout={captureLayout} />);

    expect(contentDuringLayout).toBe('');
    expect((await screen.findByText('새 본문')).textContent).toBe('새 본문');
  });
});
