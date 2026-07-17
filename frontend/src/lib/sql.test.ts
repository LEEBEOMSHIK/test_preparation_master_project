import {
  deserializeSqlAnswerGrid,
  serializeSqlAnswerGrid,
  serializeSqlResult,
  toSqlDataPayload,
} from './sql';

describe('SQL 구조화 문항 변환', () => {
  it('결과 테이블 정답을 표시용 TEXT 정답으로 직렬화한다', () => {
    expect(serializeSqlResult({
      columns: ['id', 'name'],
      rows: [['1', 'Alice'], ['2', 'Bob']],
      orderedRows: false,
    })).toBe('id | name\n1 | Alice\n2 | Bob');
  });

  it('SQL 테이블과 기대 결과를 손실 없이 payload로 만든다', () => {
    const payload = toSqlDataPayload({
      tables: [{
        name: 'member',
        columns: [{ name: 'id', dataType: 'INT', primaryKey: true }],
        rows: [['1']],
      }],
      expectedResult: {
        columns: ['id'],
        rows: [['1']],
        orderedRows: true,
      },
    });

    expect(payload?.expectedResult).toEqual({
      columns: ['id'],
      rows: [['1']],
      orderedRows: true,
    });
  });

  it('SQL 답안 그리드를 직렬화·역직렬화해 동일한 행렬로 복원한다', () => {
    const rows = [['1', 'Alice'], ['2', 'Bob']];
    expect(deserializeSqlAnswerGrid(serializeSqlAnswerGrid(rows), 2)).toEqual(rows);
  });

  it('빈 값이나 컬럼 수가 맞지 않는 손상 값은 빈 1행으로 폴백한다', () => {
    expect(deserializeSqlAnswerGrid('', 2)).toEqual([['', '']]);
    expect(deserializeSqlAnswerGrid('1 | Alice | extra', 2)).toEqual([['', '']]);
  });
});
