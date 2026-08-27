package com.tpmp.testprep.entity;

import com.tpmp.testprep.entity.Inquiry.RequestType;
import com.tpmp.testprep.entity.Inquiry.Status;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InquiryWorkflowTest {

    @ParameterizedTest
    @CsvSource({
            "GENERAL_INQUIRY,ANSWERED,true",
            "GENERAL_INQUIRY,COMPLETED,false",
            "BUG_REPORT,ANSWERED,false",
            "BUG_REPORT,COMPLETED,true",
            "EXAM_OPENING_REQUEST,UNABLE_TO_PROCESS,true"
    })
    void requestTypeControlsTerminalStatus(RequestType type, Status target, boolean allowed) {
        Inquiry inquiry = inquiry(type);

        assertThat(inquiry.canTransitionTo(target)).isEqualTo(allowed);
    }

    @Test
    void openStatusesCanTransitionBetweenEachOther() {
        Inquiry inquiry = inquiry(RequestType.FEATURE_REQUEST);

        inquiry.changeStatus(Status.ON_HOLD);
        inquiry.changeStatus(Status.IN_PROGRESS);

        assertThat(inquiry.getStatus()).isEqualTo(Status.IN_PROGRESS);
        assertThat(inquiry.isClosed()).isFalse();
    }

    @Test
    void closedInquiryCanOnlyBeReopenedToInProgress() {
        Inquiry inquiry = inquiry(RequestType.BUG_REPORT);
        inquiry.changeStatus(Status.COMPLETED);

        assertThat(inquiry.isClosed()).isTrue();
        assertThat(inquiry.canTransitionTo(Status.IN_PROGRESS)).isTrue();
        assertThat(inquiry.canTransitionTo(Status.PENDING)).isFalse();

        inquiry.reopen();

        assertThat(inquiry.getStatus()).isEqualTo(Status.IN_PROGRESS);
    }

    @Test
    void changeStatusRejectsTerminalStatusForWrongRequestType() {
        Inquiry inquiry = inquiry(RequestType.GENERAL_INQUIRY);

        assertThatThrownBy(() -> inquiry.changeStatus(Status.COMPLETED))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("INVALID_INQUIRY_STATUS_TRANSITION");
        assertThat(inquiry.getStatus()).isEqualTo(Status.PENDING);
    }

    private Inquiry inquiry(RequestType requestType) {
        return Inquiry.builder()
                .title("문의")
                .content("내용")
                .requestType(requestType)
                .build();
    }
}
