package com.tpmp.testprep.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EmailTemplateTest {

    @Test
    void duplicateClearsSystemKeyAndDeleteAuditIsRecorded() {
        User admin = admin("admin@tpmp.com");
        EmailTemplate source = EmailTemplate.create("기본", EmailTemplate.Scope.INQUIRY_STATUS,
                "제목", "<p>본문</p>", "본문", true, "INQUIRY_COMPLETED_DEFAULT", null);

        EmailTemplate copy = source.duplicate("기본 복사본", admin);
        copy.softDelete(admin);

        assertThat(copy.getSystemKey()).isNull();
        assertThat(copy.isDeleted()).isTrue();
        assertThat(copy.getDeletedByAdmin()).isSameAs(admin);
    }

    @Test
    void eventMapsOnlyThreeClosedStatuses() {
        assertThat(EmailTemplateEvent.fromStatus(Inquiry.Status.COMPLETED))
                .contains(EmailTemplateEvent.INQUIRY_COMPLETED);
        assertThat(EmailTemplateEvent.fromStatus(Inquiry.Status.IN_PROGRESS)).isEmpty();
    }

    private User admin(String email) {
        return User.builder()
                .email(email)
                .password("password")
                .name("관리자")
                .role(User.Role.ADMIN)
                .build();
    }
}
