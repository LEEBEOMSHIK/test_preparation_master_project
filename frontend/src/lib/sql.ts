import type { SqlColumn, SqlData, SqlExpectedResult, SqlTable } from '@/types';

/**
 * SQL 문항(SQL 유형) 등록/수정 폼 공용 헬퍼.
 * 입력 중에는 모든 필드를 문자열로 보관(Draft)하다가 제출 시 payload로 변환한다.
 * (scheduling.ts의 Draft ↔ Data 변환 패턴과 동일)
 */

/** 입력 중인 테이블 컬럼 1개 */
export interface SqlColumnDraft {
  name: string;
  dataType: string;
  primaryKey: boolean;
}

/** 입력 중인 테이블 1개 — rows는 컬럼 수와 동일한 길이의 문자열 배열들 */
export interface SqlTableDraft {
  name: string;
  columns: SqlColumnDraft[];
  rows: string[][];
}

/** 입력 중인 결과 테이블 정답 — columns에 이름 있는 항목이 0개면 "미사용(비활성)" 상태 */
export interface SqlExpectedResultDraft {
  columns: string[];
  rows: string[][];
  orderedRows: boolean;
}

/** 입력 중인 SQL 데이터 */
export interface SqlDataDraft {
  tables: SqlTableDraft[];
  expectedResult: SqlExpectedResultDraft;
}

/** 빈 컬럼 행 */
export function emptyColumnDraft(): SqlColumnDraft {
  return { name: '', dataType: '', primaryKey: false };
}

/** 빈 테이블 (컬럼 2개·행 1개로 시작) */
export function emptyTableDraft(): SqlTableDraft {
  return {
    name: '',
    columns: [emptyColumnDraft(), emptyColumnDraft()],
    rows: [['', '']],
  };
}

/** 비활성 상태의 결과 테이블 정답 드래프트 (컬럼 0개) */
export function emptyExpectedResultDraft(): SqlExpectedResultDraft {
  return { columns: [], rows: [], orderedRows: false };
}

/** "+ 결과 테이블 정답 추가" 클릭 시 초기 상태 — 컬럼 2개·행 1개로 시작 */
export function activateExpectedResultDraft(): SqlExpectedResultDraft {
  return { columns: ['', ''], rows: [['', '']], orderedRows: false };
}

/** 결과 테이블 정답 섹션이 "사용 중"인지 — trim 후 이름이 있는 컬럼이 1개 이상이면 true */
export function isExpectedResultEnabled(draft: SqlExpectedResultDraft): boolean {
  return draft.columns.some((c) => c.trim() !== '');
}

/** 신규 등록 폼용 빈 SQL 드래프트 (테이블 1개로 시작, 결과 테이블 정답은 비활성) */
export function emptySqlDraft(): SqlDataDraft {
  return { tables: [emptyTableDraft()], expectedResult: emptyExpectedResultDraft() };
}

/**
 * Draft → 서버 전송용 SqlData 변환.
 * - 이름이 빈 테이블/컬럼은 제외
 * - 컬럼을 이름 기준으로 필터링할 때, 남기는 컬럼의 원본 인덱스를 먼저 구해서
 *   각 행에서도 동일한 인덱스의 셀만 골라낸다(중간 컬럼 이름만 비운 경우에도 값이 밀리지 않도록).
 *   인덱스에 해당하는 셀이 없으면 빈 문자열로 패딩 (백엔드 행 길이 검증과 일치)
 * - 유효한 테이블이 하나도 없으면 undefined 반환(미전송) — 결과 테이블 정답이 있어도
 *   테이블 정의는 SQL 유형의 필수 항목이므로 예외 없이 undefined를 반환한다.
 * - expectedResult는 유효한 컬럼이 1개 이상이고 유효한 행이 1개 이상일 때만 포함한다.
 */
export function toSqlDataPayload(draft: SqlDataDraft): SqlData | undefined {
  const tables: SqlTable[] = draft.tables
    .filter((t) => t.name.trim() !== '')
    .map((t) => {
      // 이름이 있는 컬럼의 원본 인덱스를 먼저 구해, 필터와 셀 선택이 같은 인덱스 집합을 쓰도록 맞춘다.
      const keepIndices = t.columns
        .map((c, i) => i)
        .filter((i) => t.columns[i].name.trim() !== '');

      const columns: SqlColumn[] = keepIndices.map((i) => ({
        name: t.columns[i].name.trim(),
        dataType: t.columns[i].dataType.trim() || undefined,
        primaryKey: t.columns[i].primaryKey,
      }));

      const rows = t.rows
        .filter((row) => row.some((cell) => cell.trim() !== ''))
        .map((row) => keepIndices.map((i) => row[i] ?? ''));

      return {
        name: t.name.trim(),
        columns,
        rows: rows.length > 0 ? rows : undefined,
      };
    })
    .filter((t) => t.columns.length > 0);

  if (tables.length === 0) return undefined;

  const expectedResult = toSqlExpectedResultPayload(draft.expectedResult);

  return expectedResult ? { tables, expectedResult } : { tables };
}

/**
 * SqlExpectedResultDraft → SqlExpectedResult 변환 (toSqlDataPayload의 keepIndices 방식과 동일 규칙).
 * 이름이 있는 컬럼이 하나도 없거나, 값이 있는 행이 하나도 없으면 undefined(미전송).
 */
export function toSqlExpectedResultPayload(draft: SqlExpectedResultDraft): SqlExpectedResult | undefined {
  const keepIndices = draft.columns
    .map((_, i) => i)
    .filter((i) => draft.columns[i].trim() !== '');

  if (keepIndices.length === 0) return undefined;

  const columns = keepIndices.map((i) => draft.columns[i].trim());
  const rows = draft.rows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => keepIndices.map((i) => row[i] ?? ''));

  if (rows.length === 0) return undefined;

  return { columns, rows, orderedRows: draft.orderedRows };
}

/** 서버에서 받은 SqlData → 폼 편집용 Draft 변환 (없으면 빈 드래프트) */
export function fromSqlData(data?: SqlData): SqlDataDraft {
  const tables: SqlTableDraft[] = !data || data.tables.length === 0
    ? [emptyTableDraft()]
    : data.tables.map((t) => {
        const columns: SqlColumnDraft[] = t.columns.length > 0
          ? t.columns.map((c) => ({
              name: c.name,
              dataType: c.dataType ?? '',
              primaryKey: !!c.primaryKey,
            }))
          : [emptyColumnDraft(), emptyColumnDraft()];
        const columnCount = columns.length;
        const rows = t.rows && t.rows.length > 0
          ? t.rows.map((row) => {
              const next = row.slice(0, columnCount);
              while (next.length < columnCount) next.push('');
              return next;
            })
          : [Array(columnCount).fill('')];
        return { name: t.name, columns, rows };
      });

  return {
    tables,
    expectedResult: fromSqlExpectedResult(data?.expectedResult),
  };
}

/** 서버에서 받은 SqlExpectedResult → 폼 편집용 Draft 변환 (없으면 비활성 드래프트) */
function fromSqlExpectedResult(expected?: SqlExpectedResult): SqlExpectedResultDraft {
  if (!expected || expected.columns.length === 0) return emptyExpectedResultDraft();
  const columnCount = expected.columns.length;
  const rows = expected.rows && expected.rows.length > 0
    ? expected.rows.map((row) => {
        const next = row.slice(0, columnCount);
        while (next.length < columnCount) next.push('');
        return next;
      })
    : [Array(columnCount).fill('')];
  return { columns: [...expected.columns], rows, orderedRows: !!expected.orderedRows };
}

/**
 * SqlExpectedResult → "c1 | c2\nv1 | v2" 직렬화 문자열(컬럼 헤더 행 포함).
 * 관리자 등록/수정 payload의 answer 필드를 자동 세팅할 때 사용한다 —
 * 채점 후 CheckResult.correctAnswer(및 화면 표시)가 이 문자열 그대로 노출된다.
 */
export function serializeSqlResult(expectedResult: SqlExpectedResult): string {
  const headerLine = expectedResult.columns.join(' | ');
  const rowLines = expectedResult.rows.map((row) => row.join(' | '));
  return [headerLine, ...rowLines].join('\n');
}
