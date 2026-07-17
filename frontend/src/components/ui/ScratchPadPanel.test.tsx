import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MAX_TREE_COUNT, normalizeTreeData, ScratchPadPanel } from './ScratchPadPanel';

const STORAGE_KEY = 'scratchpad-tree-test';

function openTreeTab(): void {
  fireEvent.click(screen.getByLabelText('풀이 스크래치패드 열기'));
  fireEvent.click(screen.getAllByRole('button', { name: '트리' })[0]);
}

function firstTreeRegion(index: number): HTMLElement {
  return screen.getAllByRole('region', { name: `트리 ${index}` })[0];
}

describe('ScratchPadPanel 다중 트리', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('최초에는 빈 트리 하나를 표시하고 마지막 트리는 삭제할 수 없다', () => {
    render(<ScratchPadPanel storageKey={STORAGE_KEY} />);

    openTreeTab();

    expect(screen.getAllByRole('region', { name: '트리 1' })).toHaveLength(2);
    const deleteButtons = screen.getAllByRole('button', { name: '트리 1 삭제' }) as HTMLButtonElement[];
    expect(deleteButtons.every(button => button.disabled)).toBe(true);
    expect(deleteButtons[0].title).toBe('트리는 최소 1개 이상 유지해야 합니다.');
  });

  it('트리 두 개를 추가해 값을 독립적으로 입력하고 중간 트리만 삭제한다', () => {
    render(<ScratchPadPanel storageKey={STORAGE_KEY} />);
    openTreeTab();

    fireEvent.click(screen.getAllByRole('button', { name: '트리 추가' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: '트리 추가' })[0]);

    const tree1Input = within(firstTreeRegion(1)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement;
    const tree2Input = within(firstTreeRegion(2)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement;
    const tree3Input = within(firstTreeRegion(3)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement;

    fireEvent.change(tree1Input, { target: { value: '[1]' } });
    fireEvent.change(tree2Input, { target: { value: '[2]' } });
    fireEvent.change(tree3Input, { target: { value: '[3]' } });

    expect((within(firstTreeRegion(1)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement).value).toBe('[1]');
    expect((within(firstTreeRegion(2)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement).value).toBe('[2]');
    expect((within(firstTreeRegion(3)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement).value).toBe('[3]');

    fireEvent.click(within(firstTreeRegion(2)).getByRole('button', { name: '트리 2 삭제' }));

    expect(screen.queryByRole('region', { name: '트리 3' })).toBeNull();
    expect((within(firstTreeRegion(2)).getByPlaceholderText('예: [1, 2, 3, null, 4, 5]') as HTMLInputElement).value).toBe('[3]');
  });

  it('트리가 20개이면 추가 버튼을 비활성화하고 상한 안내를 표시한다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      note: '',
      trace: '',
      calcHistory: [],
      treeInputs: Array.from({ length: MAX_TREE_COUNT }, (_, index) => `[${index + 1}]`),
      treeIds: Array.from({ length: MAX_TREE_COUNT }, (_, index) => `saved-tree-${index + 1}`),
    }));

    render(<ScratchPadPanel storageKey={STORAGE_KEY} />);
    openTreeTab();

    expect(screen.getAllByRole('region')).toHaveLength(MAX_TREE_COUNT * 2);
    const addButtons = screen.getAllByRole('button', { name: '트리 추가' }) as HTMLButtonElement[];
    expect(addButtons.every(button => button.disabled)).toBe(true);
    expect(screen.getAllByRole('status')[0].textContent).toContain('최대 20개');
  });

  it('구형 treeInput을 배열로 이관하고 다음 저장에서는 legacy 필드를 제거한다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      note: '',
      trace: '',
      calcHistory: [],
      treeInput: '[1, 2, 3]',
    }));

    const { unmount } = render(<ScratchPadPanel storageKey={STORAGE_KEY} />);
    openTreeTab();
    const input = within(firstTreeRegion(1)).getByDisplayValue('[1, 2, 3]');
    fireEvent.change(input, { target: { value: '[4, 5]' } });
    unmount();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    expect(saved.treeInputs).toEqual(['[4, 5]']);
    expect(saved.treeIds).toEqual(['tree-1']);
    expect(Object.prototype.hasOwnProperty.call(saved, 'treeInput')).toBe(false);
  });

  it('손상된 배열 원소와 중복 ID를 안전하게 정규화한다', () => {
    expect(normalizeTreeData({
      treeInputs: ['[1]', 7, null],
      treeIds: ['same-id', 'same-id', 3],
      treeInput: '[legacy]',
    })).toEqual({
      treeInputs: ['[1]', '', ''],
      treeIds: ['same-id', 'tree-1', 'tree-2'],
    });
  });
});
