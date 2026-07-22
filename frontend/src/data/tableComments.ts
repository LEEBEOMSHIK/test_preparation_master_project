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
      del_yn: '삭제 여부 (Y/N)',
      use_yn: '사용 여부 (Y/N)',
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
      source_question_bank_id: 'FK → question_bank.id (원본 문항, nullable)',
      seq: '문항 순서',
      instruction: '발문(지시문) 스냅샷',
      content: '문항 내용',
      question_type: '문제 유형 (MULTIPLE_CHOICE/SHORT_ANSWER/OX/CODE/SCHEDULING/SQL)',
      options: '객관식 보기 (JSONB)',
      answer: '정답',
      explanation: '해설',
      code: '코드 문항의 코드 본문',
      language: '코드 언어',
      scheduling_data: 'CPU 스케줄링 구조화 데이터 스냅샷 (JSONB)',
      sql_data: 'SQL 테이블·기대 결과 구조화 데이터 스냅샷 (JSONB)',
      del_yn: '삭제 여부 (Y/N) — 원본 question_bank와 독립 관리(자동 전파 없음)',
      use_yn: '사용 여부 (Y/N) — 원본 question_bank와 독립 관리(자동 전파 없음)',
    },
    fkRelations: [
      { column: 'exam_id', foreignTable: 'exams', foreignColumn: 'id', displayColumn: 'title' },
      { column: 'source_question_bank_id', foreignTable: 'question_bank', foreignColumn: 'id', displayColumn: 'title' },
    ],
  },
  {
    table: 'question_bank',
    tableComment: '글로벌 문항 풀',
    columns: {
      id: 'PK',
      title: '문항 제목(관리용)',
      exam_year: '시험 연도',
      exam_round: '시험 회차',
      question_no: '원본 시험 문항번호',
      instruction: '발문(지시문)',
      content: '문항 내용',
      question_type: '문제 유형',
      category_id: 'FK → domain_slave.id (문제 유형)',
      exam_type_id: 'FK → domain_slave.id (시험 유형)',
      options: '객관식 보기 (JSONB)',
      answer: '정답',
      code: '코드 본문',
      language: '코드 언어',
      explanation: '해설',
      scheduling_data: 'CPU 스케줄링 구조화 데이터 (JSONB, SCHEDULING 유형 전용)',
      sql_data: 'SQL 구조화 데이터 (JSONB, SQL 유형 전용)',
      create_dt: '생성 일시',
      create_uno: 'FK → users.id (생성자)',
      modified_dt: '수정 일시',
      modified_uno: 'FK → users.id (수정자)',
      del_yn: '삭제 여부 (Y/N)',
      use_yn: '사용 여부 (Y/N)',
    },
    fkRelations: [
      { column: 'category_id', foreignTable: 'domain_slave', foreignColumn: 'id', displayColumn: 'name' },
      { column: 'exam_type_id', foreignTable: 'domain_slave', foreignColumn: 'id', displayColumn: 'name' },
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
      exam_year: '시험 연도 — 레거시 데이터는 title 파싱 백필, NULL 가능',
      exam_round: '시험 회차 — 레거시 데이터는 title 파싱 백필, NULL 가능',
      is_ai_custom: 'AI 커스텀 문항 시험 여부 — 레거시 데이터는 title 파싱 백필',
      created_by: 'FK → users.id (생성자)',
      created_at: '생성 일시',
      del_yn: '삭제 여부 (Y/N)',
      use_yn: '사용 여부 (Y/N)',
    },
    fkRelations: [
      { column: 'exam_paper_id', foreignTable: 'exams', foreignColumn: 'id', displayColumn: 'title' },
      { column: 'category_id', foreignTable: 'domain_slave', foreignColumn: 'id', displayColumn: 'name' },
      { column: 'created_by', foreignTable: 'users', foreignColumn: 'id', displayColumn: 'name' },
    ],
  },
  {
    table: 'exam_history_details',
    tableComment: '시험 응시 문항별 결과 스냅샷',
    columns: {
      id: 'PK',
      exam_history_id: 'FK → exam_history.id',
      question_id: '제출 시점 문항 ID',
      question_bank_id: '제출 시점 원본 문제은행 ID 스냅샷 (FK 없음, 원본 연결이 없으면 NULL)',
      seq: '문항 순서',
      title: '제출 시점 원본 문항 제목 스냅샷 (원본 연결이 없으면 NULL)',
      instruction: '제출 시점 발문(지시문) 스냅샷',
      content: '제출 시점 문항 내용 스냅샷',
      question_type: '문항 유형 스냅샷',
      user_answer: '사용자 제출 답안',
      correct_answer: '정답 스냅샷',
      correct: '정답 여부',
      scheduling_data: '제출 시점 CPU 스케줄링 구조화 데이터 스냅샷 (JSONB)',
      sql_data: '제출 시점 SQL 구조화 데이터 스냅샷 (JSONB)',
    },
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
  {
    table: 'user_exam_applications',
    tableComment: '사용자 직접 입력 시험 접수 정보',
    columns: {
      id: 'PK',
      user_id: 'FK → users.id (접수 정보 소유자, ON DELETE CASCADE)',
      exam_info_id: 'FK → exam_info.id (연결된 시험 정보, nullable, ON DELETE SET NULL)',
      exam_name: '시험명 스냅샷 (저장 시점 exam_info.title 또는 자유 입력값)',
      application_date: '접수일(신청일), nullable',
      exam_date: '시험일, nullable',
      memo: '사용자 메모, nullable',
      created_at: '생성 일시',
      updated_at: '수정 일시, nullable',
    },
    fkRelations: [
      { column: 'user_id', foreignTable: 'users', foreignColumn: 'id', displayColumn: 'name' },
      { column: 'exam_info_id', foreignTable: 'exam_info', foreignColumn: 'id', displayColumn: 'title' },
    ],
  },
];

export function getTableMeta(tableName: string): TableComment | undefined {
  return TABLE_COMMENTS.find(t => t.table === tableName);
}

export function getColumnComment(tableName: string, columnName: string): string | undefined {
  return getTableMeta(tableName)?.columns[columnName];
}
