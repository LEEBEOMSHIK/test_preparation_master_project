package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;

import java.util.List;

public record QuizQuestionView(
        Long id,
        String title,
        String content,
        /** 발문(지시문) — 문항 내용 위에 강조 표시용 (선택, 없으면 null) */
        String instruction,
        String questionType,
        List<String> options,
        String code,
        String language,
        Integer examYear,
        Integer examRound,
        // 스케줄링 구조화 데이터 — 정답(answer)은 계속 미노출, 문제 표시용 구조만 전달
        SchedulingData schedulingData,
        // SQL 구조화 데이터 — 정답 유출 방지를 위해 expectedResult는 항상 제거한 사본만 전달
        // (SqlData.withoutExpectedResult() 참고). 실제 정답은 sqlResultColumns 아래 컬럼명만 노출.
        SqlData sqlData,
        /** SQL 결과 테이블 정답의 컬럼명만 — 퀴즈 풀이 화면에서 결과 테이블 입력 그리드 헤더로 사용.
         *  sqlData.expectedResult가 없으면 null(기존 텍스트/코드 입력 UI를 그대로 사용). */
        List<String> sqlResultColumns) {

    public static QuizQuestionView from(QuestionBank qb) {
        SqlData sqlData = qb.getSqlData();
        SqlData.SqlExpectedResult expectedResult = sqlData != null ? sqlData.expectedResult() : null;
        return new QuizQuestionView(
                qb.getId(),
                qb.getTitle(),
                qb.getContent(),
                qb.getInstruction(),
                qb.getQuestionType().name(),
                qb.getOptions(),
                qb.getCode(),
                qb.getLanguage(),
                qb.getExamYear(),
                qb.getExamRound(),
                qb.getSchedulingData(),
                sqlData != null ? sqlData.withoutExpectedResult() : null,
                expectedResult != null ? expectedResult.columns() : null);
    }
}
