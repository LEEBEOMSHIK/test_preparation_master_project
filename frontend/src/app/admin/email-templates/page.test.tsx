import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('@/components/admin/EmailTemplateListPanel', () => ({
  EmailTemplateListPanel: () => <div>템플릿 목록 패널</div>,
}));

jest.mock('@/components/admin/EmailTemplateBindingsPanel', () => ({
  EmailTemplateBindingsPanel: () => <div>이벤트 연결 패널</div>,
}));

const mockPush = jest.fn<(href: string) => void>();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

const EmailTemplatesPage = require('./page').default as typeof import('./page').default;

describe('EmailTemplatesPage', () => {
  it('tab=bindings 딥링크는 연결 탭을 바로 표시한다', () => {
    render(<EmailTemplatesPage searchParams={{ tab: 'bindings' }} />);
    expect(screen.getByText('이벤트 연결 패널')).toBeInTheDocument();
    expect(screen.queryByText('템플릿 목록 패널')).not.toBeInTheDocument();
  });

  it('탭을 누르면 URL query를 고정한다', () => {
    render(<EmailTemplatesPage searchParams={{}} />);
    fireEvent.click(screen.getByRole('tab', { name: '이벤트 연결' }));
    expect(mockPush).toHaveBeenCalledWith('/admin/email-templates?tab=bindings');
  });
});
