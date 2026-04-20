export interface FkRelation {
  column: string;
  foreignTable: string;
  foreignColumn: string;
  displayColumn: string;
}

export interface TableComment {
  table: string;
  tableComment: string;
  columns: Record<string, string>;
  fkRelations?: FkRelation[];
}

// 이 파일은 docs/db-guidelines.md 섹션 9와 동기화해 유지한다.
export const TABLE_COMMENTS: TableComment[] = [
  {
    table: 'users',
    tableComment: '사용자 계정',
    columns: {
      id: 'PK',
      email: '이메일 (로그인 ID)',
      password: '비밀번호 (해시)',
      role: '권한 (ADMIN/USER)',
      name: '사용자 이름',
    },
  },
  {
    table: 'exams',
    tableComment: '시험지 (문항 묶음)',
    columns: {
      id: 'PK',
      title: '시험지 제목',
      order_no: '정렬 순서',
      question_mode: '출제 방식 (RANDOM/SEQUENCE)',
      created_by: 'FK → users.id (생성자)',
    },
    fkRelations: [
      { column: 'created_by', foreignTable: 'users', foreignColumn: 'id', displayColumn: 'name' },
    ],
  },
  {
    table: 'questions',
    tableComment: '시험지 내 문항',
    columns: {
      id: 'PK',
      exam_id: 'FK → exams.id (시험지)',
      seq: '문항 순서',
      content: '문항 내용',
      question_type: '문제 유형 (MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE)',
      options: '객관식 보기 (JSONB)',
      answer: '정답',
      explanation: '해설',
      code: '코드 문항의 코드 본문',
      language: '코드 언어',
    },
    fkRelations: [
      { column: 'exam_id', foreignTable: 'exams', foreignColumn: 'id', displayColumn: 'title' },
    ],
  },
  {
    table: 'question_bank',
    tableComment: '글로벌 문항 풀',
    columns: {
      id: 'PK',
      content: '문항 내용',
      question_type: '문제 유형',
      category_id: 'FK → domain_slave.id (문제 유형)',
      options: '객관식 보기 (JSONB)',
      answer: '정답',
      code: '코드 본문',
      language: '코드 언어',
      explanation: '해설',
      create_dt: '생성 일시',
      create_uno: 'FK → users.id (생성자)',
      modified_dt: '수정 일시',
      modified_uno: 'FK → users.id (수정자)',
      del_yn: '삭제 여부 (Y/N)',
      use_yn: '사용 여부 (Y/N)',
    },
    fkRelations: [
      { column: 'category_id', foreignTable: 'domain_slave', foreignColumn: 'id', displayColumn: 'name' },
      { column: 'create_uno', foreignTable: 'users', foreignColumn: 'id', displayColumn: 'name' },
      { column: 'modified_uno', foreignTable: 'users', foreignColumn: 'id', displayColumn: 'name' },
    ],
  },
  {
    table: 'domain_master',
    tableComment: '도메인 마스터 (분류 그룹)',
    columns: {
      id: 'PK',
      name: '분류 그룹명',
    },
  },
  {
    table: 'domain_slave',
    tableComment: '도메인 슬레이브 (분류 값)',
    columns: {
      id: 'PK',
      master_id: 'FK → domain_master.id (상위 분류)',
      name: '분류 값 이름',
      display_order: '정렬 순서',
    },
    fkRelations: [
      { column: 'master_id', foreignTable: 'domain_master', foreignColumn: 'id', displayColumn: 'name' },
    ],
  },
  {
    table: 'examinations',
    tableComment: '시험 이벤트',
    columns: {
      id: 'PK',
      title: '시험 제목',
      exam_paper_id: 'FK → exams.id (사용 시험지)',
      category_id: 'FK → domain_slave.id (시험 유형)',
      time_limit: '제한 시간 (분)',
      created_by: 'FK → users.id (생성자)',
      created_at: '생성 일시',
    },
    fkRelations: [
      { column: 'exam_paper_id', foreignTable: 'exams', foreignColumn: 'id', displayColumn: 'title' },
      { column: 'category_id', foreignTable: 'domain_slave', foreignColumn: 'id', displayColumn: 'name' },
      { column: 'created_by', foreignTable: 'users', foreignColumn: 'id', displayColumn: 'name' },
    ],
  },
  {
    table: 'quotes',
    tableComment: '명언',
    columns: {
      id: 'PK',
      content: '명언 내용',
      author: '저자',
      use_yn: '사용 여부 (Y/N)',
      created_at: '생성 일시',
    },
  },
  {
    table: 'concept_notes',
    tableComment: '개념 노트',
    columns: {
      id: 'PK',
    },
  },
  {
    table: 'inquiries',
    tableComment: '문의',
    columns: {
      id: 'PK',
    },
  },
];

export function getTableMeta(tableName: string): TableComment | undefined {
  return TABLE_COMMENTS.find(t => t.table === tableName);
}

export function getColumnComment(tableName: string, columnName: string): string | undefined {
  return getTableMeta(tableName)?.columns[columnName];
}
