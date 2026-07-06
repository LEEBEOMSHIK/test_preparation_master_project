package com.tpmp.testprep.entity.support;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

/**
 * CPU 스케줄링 구조화 문항 데이터 — question_bank.scheduling_data(JSONB) 컬럼에 저장된다.
 * <p>
 * SCHEDULING 유형 문항 전용 부가 데이터로, CODE 유형의 code/language 부가필드와 동일한 패턴이다.
 * 자동 스케줄링 계산·채점은 하지 않으며(정답은 관리자가 answer 필드에 직접 입력),
 * 문제 구조(알고리즘·타임퀀텀·프로세스 목록)만 표 형태로 사용자에게 보여주기 위해 사용한다.
 * </p>
 */
public record SchedulingData(
        @NotNull(message = "스케줄링 알고리즘은 필수입니다.")
        SchedulingAlgorithm algorithm,

        /** RR(라운드로빈)에서만 사용하는 타임 퀀텀 (그 외 알고리즘은 null) */
        Integer timeQuantum,

        @NotEmpty(message = "프로세스 목록은 최소 1개 이상이어야 합니다.")
        List<@Valid ProcessRow> processes
) {

    /** 지원하는 CPU 스케줄링 알고리즘 6종 */
    public enum SchedulingAlgorithm {
        FCFS,
        SJF,
        SRTF,
        PRIORITY_NON_PREEMPTIVE,
        PRIORITY_PREEMPTIVE,
        RR
    }

    /** 프로세스 1행 (PID/도착시간/실행시간/우선순위) */
    public record ProcessRow(
            @NotBlank(message = "프로세스 ID는 필수입니다.")
            String pid,

            @NotNull(message = "도착 시간은 필수입니다.")
            @PositiveOrZero(message = "도착 시간은 0 이상이어야 합니다.")
            Integer arrivalTime,

            @NotNull(message = "실행 시간은 필수입니다.")
            @Positive(message = "실행 시간은 1 이상이어야 합니다.")
            Integer burstTime,

            /** PRIORITY_NON_PREEMPTIVE / PRIORITY_PREEMPTIVE 에서만 사용 (그 외는 null 허용) */
            Integer priority
    ) {}
}
