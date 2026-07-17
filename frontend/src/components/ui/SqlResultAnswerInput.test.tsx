import { expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { SqlResultAnswerInput } from './SqlResultAnswerInput';

describe('SqlResultAnswerInput', () => {
  it('문항 전환으로 재마운트되면 해당 문항의 저장 답안을 복원한다', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <SqlResultAnswerInput
        key="question-1"
        columns={['id', 'name']}
        value={'1 | Alice\n2 | Bob'}
        onChange={onChange}
      />,
    );

    expect(screen.getByDisplayValue('Alice')).not.toBeNull();

    rerender(
      <SqlResultAnswerInput
        key="question-2"
        columns={['id', 'name']}
        value="3 | Carol"
        onChange={onChange}
      />,
    );

    expect(screen.getByDisplayValue('Carol')).not.toBeNull();
    expect(screen.queryByDisplayValue('Alice')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('동일 문항의 외부 value 변경을 onChange 재호출 없이 반영한다', async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <SqlResultAnswerInput columns={['id']} value="1" onChange={onChange} />,
    );

    rerender(<SqlResultAnswerInput columns={['id']} value="2" onChange={onChange} />);

    await waitFor(() => expect(screen.getByDisplayValue('2')).not.toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });
});
