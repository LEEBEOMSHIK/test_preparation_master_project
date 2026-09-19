package com.tpmp.testprep.exception;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void exactPatchNoteVersionConstraint_mapsToConflict() {
        ResponseEntity<?> response = handler.handleDataIntegrity(
                new DataIntegrityViolationException("duplicate key violates ux_patch_notes_version_active"));

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).extracting("error")
                .extracting("code").isEqualTo(ErrorCode.PATCH_NOTE_VERSION_DUPLICATE.name());
    }

    @Test
    void ordinaryException_keepsInternalServerErrorEvenWhenMessageMentionsConstraint() {
        ResponseEntity<?> response = handler.handleUnexpected(
                new IllegalStateException("ux_patch_notes_version_active"));

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody()).extracting("error")
                .extracting("code").isEqualTo(ErrorCode.INTERNAL_ERROR.name());
    }

    @Test
    void differentDataIntegrityConstraint_doesNotBecomePatchNoteDuplicate() {
        ResponseEntity<?> response = handler.handleDataIntegrity(
                new DataIntegrityViolationException("duplicate key violates ux_other_constraint"));

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getBody()).extracting("error")
                .extracting("code").isEqualTo(ErrorCode.DOMAIN_IN_USE.name());
    }
}
