import React from 'react';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, jest } from '@jest/globals';

jest.mock('next/navigation', () => ({ useParams: () => ({ id: '42' }) }));
jest.mock('@/components/admin/EmailTemplateForm', () => ({
  EmailTemplateForm: ({ mode, templateId }: { mode: string; templateId?: number }) => (
    <div>{mode}:{templateId}</div>
  ),
}));

const EditEmailTemplatePage = require('./page').default as typeof import('./page').default;

describe('EditEmailTemplatePage', () => {
  it('URL id를 숫자로 변환해 편집 폼에 전달한다', () => {
    render(<EditEmailTemplatePage />);
    expect(screen.getByText('edit:42')).toBeInTheDocument();
  });
});
