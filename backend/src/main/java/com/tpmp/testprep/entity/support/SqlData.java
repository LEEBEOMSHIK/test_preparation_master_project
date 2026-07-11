package com.tpmp.testprep.entity.support;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * SQL 구조화 문항 데이터 — question_bank.sql_data(JSONB) 컬럼에 저장된다.
 * <p>
 * SQL 유형 문항 전용 부가 데이터로, SCHEDULING 유형의 scheduling_data 부가필드와 동일한 패턴이다.
 * 문제 구조(테이블·컬럼·샘플 데이터)는 표 또는 DDL 형태로 사용자에게 보여주기 위해 사용한다.
 * </p>
 * <p>
 * 정답은 기본적으로 관리자가 answer 필드에 직접 입력하지만("SELECT문을 쓰시오"류),
 * "실행 결과를 쓰시오"류 문항은 SQL을 직접 실행/채점하지 않는 대신 {@link #expectedResult}
 * (컬럼×튜플 결과 테이블)를 선택적으로 저장해 채점할 수 있다. expectedResult가 없으면
 * 기존처럼 answer 텍스트 비교로 채점한다.
 * </p>
 */
public record SqlData(
        @NotEmpty(message = "테이블 목록은 최소 1개 이상이어야 합니다.")
        List<@Valid SqlTable> tables,

        /**
         * 결과 테이블 정답 (선택) — "실행 결과를 쓰시오"류 문항의 정답을 컬럼×행 형태로 저장.
         * null이면 기존처럼 answer 텍스트로 채점한다. 정답 유출 방지를 위해 사용자(퀴즈) 노출
         * DTO에는 절대 포함하지 않는다 — {@link #withoutExpectedResult()} 참고.
         */
        SqlExpectedResult expectedResult
) {

    /** 하위 호환용 편의 생성자 — expectedResult 없이 테이블만 지정한다. */
    public SqlData(List<SqlTable> tables) {
        this(tables, null);
    }

    /**
     * 정답 유출 방지용 헬퍼 — expectedResult를 제거한 사본을 반환한다.
     * 퀴즈 문제 노출용 DTO({@code QuizQuestionView})에 sqlData를 매핑할 때 반드시 사용해야 한다.
     */
    public SqlData withoutExpectedResult() {
        return this.expectedResult == null ? this : new SqlData(this.tables, null);
    }

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

    /**
     * SQL "결과 테이블(컬럼×튜플)" 정답.
     * <p>
     * "실행 결과를 쓰시오"류 문항의 정답을 표(컬럼 헤더 + 행)로 저장한다. 채점은
     * {@code AnswerGrader.isSqlResultTableCorrect}가 담당하며, orderedRows가 false면
     * 행 순서를 무시한 다중집합 비교, true면 행 순서까지 그대로 비교한다(ORDER BY 문제).
     * 0행 정답은 지원하지 않는다(등록 시 rows 비어있으면 검증 오류).
     * </p>
     */
    public record SqlExpectedResult(
            List<String> columns,
            List<List<String>> rows,
            boolean orderedRows
    ) {}
}
