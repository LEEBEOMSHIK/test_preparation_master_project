package com.tpmp.testprep.entity.support;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * SQL 구조화 문항 데이터 — question_bank.sql_data(JSONB) 컬럼에 저장된다.
 * <p>
 * SQL 유형 문항 전용 부가 데이터로, SCHEDULING 유형의 scheduling_data 부가필드와 동일한 패턴이다.
 * SQL 실행·자동 채점은 하지 않으며(정답은 관리자가 answer 필드에 직접 입력),
 * 문제 구조(테이블·컬럼·샘플 데이터)만 표 또는 DDL 형태로 사용자에게 보여주기 위해 사용한다.
 * </p>
 */
public record SqlData(
        @NotEmpty(message = "테이블 목록은 최소 1개 이상이어야 합니다.")
        List<@Valid SqlTable> tables
) {

    /** SQL 문제에 등장하는 테이블 1개 (이름/컬럼 목록/샘플 데이터 행) */
    public record SqlTable(
            @NotBlank(message = "테이블명은 필수입니다.")
            String name,

            @NotEmpty(message = "컬럼 목록은 최소 1개 이상이어야 합니다.")
            List<@Valid SqlColumn> columns,

            /** 샘플 데이터 행 — 선택(null/빈 리스트 허용), 각 행의 셀 수는 columns 개수와 일치해야 함 */
            List<List<String>> rows
    ) {}

    /** 테이블 컬럼 1개 (이름/데이터타입/PK 여부) */
    public record SqlColumn(
            @NotBlank(message = "컬럼명은 필수입니다.")
            String name,

            /** 데이터 타입 (예: INT, VARCHAR(50)) — 선택 */
            String dataType,

            boolean primaryKey
    ) {}
}
