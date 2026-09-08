import { describe, expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { ListPagination } from './ListPagination';

declare const jest: typeof import('@jest/globals').jest;

describe('ListPagination', () => {
  it('한 페이지뿐이어도 현재 범위와 전체 건수 및 페이지 크기 선택을 표시한다', () => {
    const onPageSizeChange = jest.fn();

    render(
      <ListPagination
        page={0}
        totalPages={1}
        totalElements={3}
        pageSize={5}
        onChange={jest.fn()}
        onPageSizeChange={onPageSizeChange}
      />,
    );

    expect(screen.getByText('1-3 / 전체 3건')).toBeTruthy();
    const pageSizeSelect = screen.getByRole('combobox', { name: '페이지당 항목 수' });
    expect(Array.from((pageSizeSelect as HTMLSelectElement).options).map(option => option.value))
      .toEqual(['5', '10', '20', '50']);

    fireEvent.change(pageSizeSelect, { target: { value: '20' } });
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('페이지를 이동하면 콜백을 호출하고 지정한 목록 상단으로 스크롤한다', () => {
    const onChange = jest.fn();
    const scrollIntoView = jest.fn();
    const target = document.createElement('div');
    target.id = 'result-list';
    target.scrollIntoView = scrollIntoView;
    document.body.appendChild(target);

    render(
      <ListPagination
        page={3}
        totalPages={12}
        totalElements={58}
        pageSize={5}
        onChange={onChange}
        scrollTargetId="result-list"
      />,
    );

    expect(screen.getByText('16-20 / 전체 58건')).toBeTruthy();
    expect(screen.getByRole('button', { name: '1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '8' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '다음 페이지' }));

    expect(onChange).toHaveBeenCalledWith(4);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    target.remove();
  });

  it('항목이 없으면 0건 범위를 표시하고 크기 선택은 콜백이 없을 때 숨긴다', () => {
    render(
      <ListPagination
        page={0}
        totalPages={0}
        totalElements={0}
        pageSize={10}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('0 / 전체 0건')).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: '페이지당 항목 수' })).toBeNull();
  });
});
