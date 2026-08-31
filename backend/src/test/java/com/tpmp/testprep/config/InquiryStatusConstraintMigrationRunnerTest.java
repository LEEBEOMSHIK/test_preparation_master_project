package com.tpmp.testprep.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InquiryStatusConstraintMigrationRunnerTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void replacesStaleConstraintWithSixStatuses() throws Exception {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class)))
                .thenReturn("CHECK (status IN ('PENDING','ON_HOLD','ANSWERED'))");

        new InquiryStatusConstraintMigrationRunner(jdbcTemplate).run();

        InOrder order = inOrder(jdbcTemplate);
        order.verify(jdbcTemplate).execute("ALTER TABLE inquiries DROP CONSTRAINT inquiries_status_check");
        order.verify(jdbcTemplate).execute("ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check CHECK " +
                "(status IN ('PENDING','IN_PROGRESS','ON_HOLD','ANSWERED','COMPLETED','UNABLE_TO_PROCESS'))");
    }

    @Test
    void leavesCorrectConstraintUntouched() throws Exception {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class)))
                .thenReturn("CHECK (status IN ('PENDING','IN_PROGRESS','ON_HOLD','ANSWERED','COMPLETED','UNABLE_TO_PROCESS'))");

        new InquiryStatusConstraintMigrationRunner(jdbcTemplate).run();

        verify(jdbcTemplate, never()).execute(anyString());
    }
}
