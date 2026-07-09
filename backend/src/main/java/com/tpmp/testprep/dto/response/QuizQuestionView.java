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
        // SQL 구조화 데이터 — 정답(answer)은 계속 미노출, 문제 표시용 구조만 전달
        SqlData sqlData) {

    public static QuizQuestionView from(QuestionBank qb) {
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
                qb.getSqlData());
    }
}
