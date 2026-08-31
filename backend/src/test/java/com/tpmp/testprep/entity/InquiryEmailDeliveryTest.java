package com.tpmp.testprep.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class InquiryEmailDeliveryTest {

    @Test
    void pendingStoresBothBodies() {
        InquiryEmailDelivery delivery = InquiryEmailDelivery.pending(inquiry(), null,
                InquiryEmailDelivery.EventType.COMPLETED, "user@tpmp.com", "제목", "텍스트", "<p>HTML</p>");

        assertThat(delivery.getBody()).isEqualTo("텍스트");
        assertThat(delivery.getHtmlBody()).isEqualTo("<p>HTML</p>");
    }

    private Inquiry inquiry() {
        User user = User.builder()
                .email("user@tpmp.com")
                .password("password")
                .name("사용자")
                .role(User.Role.USER)
                .build();
        return Inquiry.builder()
                .user(user)
                .title("문의 제목")
                .content("문의 본문")
                .requestType(Inquiry.RequestType.GENERAL_INQUIRY)
                .build();
    }
}
