package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * deleteSlave의 isSlaveInUse 판정이 소프트 삭제된(del_yn='Y') examinations는 참조로 치지 않는지 검증한다.
 * (소프트 삭제된 examinations는 도메인 슬레이브 삭제를 막지 않아야 한다.)
 */
@ExtendWith(MockitoExtension.class)
class DomainServiceTest {

    @Mock private DomainMasterRepository domainMasterRepository;
    @Mock private DomainSlaveRepository domainSlaveRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private ExaminationRepository examinationRepository;
    @Mock private DomainMaster master;
    @Mock private DomainSlave slave;

    private DomainService service;

    @BeforeEach
    void setUp() {
        service = new DomainService(domainMasterRepository, domainSlaveRepository, questionBankRepository, examinationRepository);
        when(domainMasterRepository.findById(100L)).thenReturn(Optional.of(master));
        when(domainSlaveRepository.findById(1L)).thenReturn(Optional.of(slave));
        when(slave.getMaster()).thenReturn(master);
        when(master.getId()).thenReturn(100L);
        when(questionBankRepository.existsActiveByCategoryIdOrExamTypeId(1L)).thenReturn(false);
    }

    /**
     * HIST-20260724 — questionBankRepository 쪽 판정이 소프트 삭제된(del_yn='Y') question_bank만 남아있어도
     * "사용 중 아님"으로 정확히 판단하는지 검증한다(버그: 과거에는 del_yn 필터가 없어 소프트 삭제된 문항만
     * 남아도 영구 삭제가 막혔음). 서비스는 리포지토리가 반환한 값을 그대로 신뢰하므로, 여기서는
     * existsActiveByCategoryIdOrExamTypeId가 false를 반환하면(=활성 문항 없음) 삭제가 허용되는지 확인한다.
     */
    @Test
    void deleteSlaveAllowedWhenOnlySoftDeletedQuestionBankReferencesIt() {
        when(questionBankRepository.existsActiveByCategoryIdOrExamTypeId(1L)).thenReturn(false);
        when(examinationRepository.existsByCategoryIdAndDelYn(1L, "N")).thenReturn(false);

        assertThatCode(() -> service.deleteSlave(100L, 1L)).doesNotThrowAnyException();
    }

    @Test
    void deleteSlaveBlockedWhenActiveQuestionBankReferencesIt() {
        when(questionBankRepository.existsActiveByCategoryIdOrExamTypeId(1L)).thenReturn(true);

        assertThatThrownBy(() -> service.deleteSlave(100L, 1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.DOMAIN_IN_USE));
    }

    @Test
    void deleteSlaveAllowedWhenOnlySoftDeletedExaminationReferencesIt() {
        when(examinationRepository.existsByCategoryIdAndDelYn(1L, "N")).thenReturn(false);

        assertThatCode(() -> service.deleteSlave(100L, 1L)).doesNotThrowAnyException();
    }

    @Test
    void deleteSlaveBlockedWhenActiveExaminationReferencesIt() {
        when(examinationRepository.existsByCategoryIdAndDelYn(1L, "N")).thenReturn(true);

        assertThatThrownBy(() -> service.deleteSlave(100L, 1L))
                .isInstanceOf(BusinessException.class)
                .satisfies(error -> assertThat(((BusinessException) error).getErrorCode())
                        .isEqualTo(ErrorCode.DOMAIN_IN_USE));
    }
}
