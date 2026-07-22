package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * examinations 소프트 삭제(del_yn)·비활성화(use_yn) 토글 회귀 테스트.
 * deleteExamination이 하드 delete 대신 softDelete()를 호출하는지, 관리자 단건 조회가
 * del_yn='N' 필터를 거치는지, toggleUseYn이 정확히 동작하는지 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class ExaminationServiceAuditFlagsTest {

    @Mock private ExaminationRepository examinationRepository;
    @Mock private ExamRepository examRepository;
    @Mock private DomainSlaveRepository domainSlaveRepository;
    @Mock private UserRepository userRepository;
    @Mock private Examination examination;
    @Mock private Exam examPaper;
    @Mock private DomainSlave category;

    private ExaminationService service;

    @BeforeEach
    void setUp() {
        service = new ExaminationService(examinationRepository, examRepository, domainSlaveRepository, userRepository);
    }

    @Test
    void deleteExaminationSoftDeletesInsteadOfHardDelete() {
        when(examinationRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.of(examination));

        service.deleteExamination(1L);

        verify(examination).softDelete();
        verify(examinationRepository, never()).delete(examination);
    }

    @Test
    void deleteExaminationOnAlreadyDeletedThrowsNotFound() {
        when(examinationRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteExamination(1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.EXAMINATION_NOT_FOUND));
    }

    @Test
    void toggleUseYnTogglesExaminationAndReturnsResponse() {
        when(examinationRepository.findByIdAndDelYn(1L, "N")).thenReturn(Optional.of(examination));
        when(examination.getExamPaper()).thenReturn(examPaper);
        when(examPaper.getId()).thenReturn(5L);
        when(examPaper.getTitle()).thenReturn("시험지");
        when(examination.getCategory()).thenReturn(category);
        when(category.getId()).thenReturn(9L);
        when(category.getName()).thenReturn("카테고리");

        service.toggleUseYn(1L);

        verify(examination).toggleUseYn();
    }
}
