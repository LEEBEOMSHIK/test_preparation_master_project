import React, { createRef, forwardRef, useImperativeHandle } from 'react';
import '@testing-library/jest-dom/jest-globals';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { RichTextEditorHandle } from '@/types';

const mockQuill = {
  container: document.createElement('div'),
  root: document.createElement('div'),
  focus: jest.fn(),
  getLength: jest.fn(() => 4),
  getSelection: jest.fn(() => ({ index: 2, length: 0 })),
  insertEmbed: jest.fn(),
  insertText: jest.fn(),
  setSelection: jest.fn(),
};

jest.mock('react-quill', () => ({
  __esModule: true,
  default: forwardRef(function MockReactQuill(_, ref: React.ForwardedRef<{ getEditor: () => typeof mockQuill }>) {
    useImperativeHandle(ref, () => ({ getEditor: () => mockQuill }));
    return <div data-testid="quill-instance" />;
  }),
}));

const RichTextEditor = require('./RichTextEditor').RichTextEditor as typeof import('./RichTextEditor').RichTextEditor;

describe('RichTextEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allowImages=false이면 이미지 툴바와 업로드 입력을 노출하지 않는다', async () => {
    render(<RichTextEditor value="" onChange={jest.fn()} allowImages={false} />);

    expect(await screen.findByTestId('rich-text-editor')).not.toHaveAttribute('data-image-enabled', 'true');
    expect(screen.queryByLabelText('이미지 업로드')).not.toBeInTheDocument();
  });

  it('insertText는 현재 커서에 템플릿 변수를 삽입한다', async () => {
    const ref = createRef<RichTextEditorHandle>();
    render(<RichTextEditor ref={ref} value="<p>본문</p>" onChange={jest.fn()} allowImages={false} />);

    await waitFor(() => expect(screen.getByTestId('quill-instance')).toBeInTheDocument());
    await waitFor(() => expect(ref.current).not.toBeNull());
    act(() => ref.current?.insertText('{{recipientName}}'));

    expect(mockQuill.insertText).toHaveBeenCalledWith(2, '{{recipientName}}', 'user');
  });
});
