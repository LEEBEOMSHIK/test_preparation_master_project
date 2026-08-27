package com.tpmp.testprep.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import static org.assertj.core.api.Assertions.assertThat;

class InquiryControllerSecurityTest {

    @Test
    void adminInquiryEndpointsRequireAdminRole() {
        PreAuthorize authorization = AdminInquiryController.class.getAnnotation(PreAuthorize.class);

        assertThat(authorization).isNotNull();
        assertThat(authorization.value()).isEqualTo("hasRole('ADMIN')");
    }
}
