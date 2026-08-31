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
const mockUpload = jest.fn();

jest.mock('@/services/examService', () => ({
  examService: { adminUploadQuestionImage: mockUpload },
}));

jest.mock('react-quill', () => ({
  __esModule: true,
  default: forwardRef(function MockReactQuill(_, ref: React.ForwardedRef<{ getEditor: () => typeof mockQuill }>) {
    useImperativeHandle(ref, () => ({ getEditor: () => mockQuill }));
    return <div data-testid="quill-instance" />;
  }),
}));

const RichTextEditor = require('./RichTextEditor').RichTextEditor as typeof import('./RichTextEditor').RichTextEditor;

function transferEvent(type: 'paste' | 'drop', values: Record<string, string>): ClipboardEvent | DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const transfer = {
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types: Object.keys(values),
    getData: (format: string) => values[format] ?? '',
  };
  Object.defineProperty(event, type === 'paste' ? 'clipboardData' : 'dataTransfer', { value: transfer });
  return event as ClipboardEvent | DragEvent;
}

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

  it('allowImages=false이면 HTML img paste를 전파 전에 차단한다', async () => {
    render(<RichTextEditor value="" onChange={jest.fn()} allowImages={false} />);
    await screen.findByTestId('quill-instance');
    const event = transferEvent('paste', { 'text/html': '<p>본문</p><img src="https://cdn.tpmp.com/a.png">' });
    const stopPropagation = jest.spyOn(event, 'stopPropagation');
    const stopImmediatePropagation = jest.spyOn(event, 'stopImmediatePropagation');

    act(() => { mockQuill.container.dispatchEvent(event); });

    expect(event.defaultPrevented).toBe(true);
    expect(stopPropagation).toHaveBeenCalled();
    expect(stopImmediatePropagation).toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('allowImages=false이면 image URI drop을 차단하고 업로드하지 않는다', async () => {
    render(<RichTextEditor value="" onChange={jest.fn()} allowImages={false} />);
    await screen.findByTestId('quill-instance');
    const event = transferEvent('drop', { 'text/uri-list': 'data:image/png;base64,iVBORw0KGgo=' });

    act(() => { mockQuill.container.dispatchEvent(event); });

    expect(event.defaultPrevented).toBe(true);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('allowImages=false여도 일반 텍스트 paste와 비이미지 링크 drop은 허용한다', async () => {
    render(<RichTextEditor value="" onChange={jest.fn()} allowImages={false} />);
    await screen.findByTestId('quill-instance');
    const pasteEvent = transferEvent('paste', { 'text/plain': '일반 텍스트' });
    const dropEvent = transferEvent('drop', { 'text/uri-list': 'https://tpmp.com/help' });

    act(() => {
      mockQuill.container.dispatchEvent(pasteEvent);
      mockQuill.container.dispatchEvent(dropEvent);
    });

    expect(pasteEvent.defaultPrevented).toBe(false);
    expect(dropEvent.defaultPrevented).toBe(false);
  });
});
