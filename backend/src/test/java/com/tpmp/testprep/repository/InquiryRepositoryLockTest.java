package com.tpmp.testprep.repository;

import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class InquiryRepositoryLockTest {

    @Test
    void inquiryMutationLookupUsesPessimisticWriteLock() throws Exception {
        Method method = InquiryRepository.class.getMethod("findByIdForUpdate", Long.class);

        assertThat(method.getAnnotation(Lock.class).value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
    }
}
