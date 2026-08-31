package com.tpmp.testprep.dto.response;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseContractTest {

    @Test
    void businessErrorIncludesStructuredDetails() {
        ApiResponse<Void> response = ApiResponse.fail(
                "EMAIL_TEMPLATE_IN_USE", "사용 중", List.of("INQUIRY_COMPLETED"));

        assertThat(response.getError().details()).isEqualTo(List.of("INQUIRY_COMPLETED"));
    }

    @Test
    void legacyBusinessErrorOverloadKeepsNullDetails() {
        ApiResponse<Void> response = ApiResponse.fail("INVALID_INPUT", "입력 오류");

        assertThat(response.getError().details()).isNull();
    }
}
