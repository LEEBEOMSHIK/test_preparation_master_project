package com.tpmp.testprep.service.support;

import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;

/** 문제은행과 시험지 수동 문항이 공유하는 SCHEDULING·SQL 구조 정합성 검증기. */
public final class StructuredQuestionValidator {

    private StructuredQuestionValidator() {}

    public static void validate(
            String questionType,
            SchedulingData schedulingData,
            SqlData sqlData
    ) {
        if ("SCHEDULING".equals(questionType)) validateScheduling(schedulingData);
        if ("SQL".equals(questionType)) validateSql(sqlData);
    }

    private static void validateScheduling(SchedulingData data) {
        if (data == null || data.algorithm() == null
                || data.processes() == null || data.processes().isEmpty()) {
            throw new BusinessException(ErrorCode.SCHEDULING_DATA_INVALID);
        }
        if (data.algorithm() == SchedulingData.SchedulingAlgorithm.RR
                && (data.timeQuantum() == null || data.timeQuantum() <= 0)) {
            throw new BusinessException(ErrorCode.SCHEDULING_DATA_INVALID);
        }
        boolean priorityAlgorithm =
                data.algorithm() == SchedulingData.SchedulingAlgorithm.PRIORITY_NON_PREEMPTIVE
                || data.algorithm() == SchedulingData.SchedulingAlgorithm.PRIORITY_PREEMPTIVE;
        boolean invalidProcess = data.processes().stream().anyMatch(process ->
                process == null
                || process.pid() == null || process.pid().isBlank()
                || process.arrivalTime() == null || process.arrivalTime() < 0
                || process.burstTime() == null || process.burstTime() <= 0
                || priorityAlgorithm && process.priority() == null);
        if (invalidProcess) {
            throw new BusinessException(ErrorCode.SCHEDULING_DATA_INVALID);
        }
    }

    private static void validateSql(SqlData data) {
        if (data == null || data.tables() == null || data.tables().isEmpty()) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
        for (SqlData.SqlTable table : data.tables()) {
            if (table == null || table.name() == null || table.name().isBlank()
                    || table.columns() == null || table.columns().isEmpty()
                    || table.columns().stream().anyMatch(column ->
                            column == null || column.name() == null || column.name().isBlank())) {
                throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
            }
            if (table.rows() != null && table.rows().stream()
                    .anyMatch(row -> row == null || row.size() != table.columns().size())) {
                throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
            }
        }
        validateExpectedResult(data.expectedResult());
    }

    private static void validateExpectedResult(SqlData.SqlExpectedResult expected) {
        if (expected == null) return;
        if (expected.columns() == null || expected.columns().isEmpty()
                || expected.columns().stream().anyMatch(column -> column == null || column.isBlank())
                || expected.rows() == null || expected.rows().isEmpty()) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
        if (expected.rows().stream()
                .anyMatch(row -> row == null || row.size() != expected.columns().size())) {
            throw new BusinessException(ErrorCode.SQL_DATA_INVALID);
        }
    }
}
