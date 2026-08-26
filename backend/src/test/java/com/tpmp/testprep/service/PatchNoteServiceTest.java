package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.PatchNotePublicationRequest;
import com.tpmp.testprep.dto.request.PatchNoteRequest;
import com.tpmp.testprep.dto.response.PatchNoteResponse;
import com.tpmp.testprep.entity.PatchNote;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.PatchNoteRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatchNoteServiceTest {

    private static final String ADMIN_EMAIL = "admin@tpmp.com";
    private static final Long ADMIN_ID = 1L;

    @Mock private PatchNoteRepository patchNoteRepository;
    @Mock private UserRepository userRepository;
    @Mock private User admin;

    private PatchNoteService service;

    @BeforeEach
    void setUp() {
        service = new PatchNoteService(patchNoteRepository, userRepository);
        lenient().when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
        lenient().when(admin.getId()).thenReturn(ADMIN_ID);
        lenient().when(patchNoteRepository.save(any(PatchNote.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void create_persistsDraftWithAdminAudit() {
        PatchNoteResponse response = service.create(request(false), ADMIN_EMAIL);

        ArgumentCaptor<PatchNote> captor = ArgumentCaptor.forClass(PatchNote.class);
        verify(patchNoteRepository).save(captor.capture());
        PatchNote saved = captor.getValue();
        assertThat(response.published()).isFalse();
        assertThat(response.publishedAt()).isNull();
        assertThat(response.createdAt()).isNotNull();
        assertThat(response.updatedAt()).isNotNull();
        assertThat(saved.isPublished()).isFalse();
        assertThat(saved.getPublishedDt()).isNull();
        assertThat(saved.getCreateUno()).isEqualTo(ADMIN_ID);
        assertThat(saved.getModifiedUno()).isEqualTo(ADMIN_ID);
    }

    @Test
    void create_publishesImmediatelyWhenRequested() {
        PatchNoteResponse response = service.create(request(true), ADMIN_EMAIL);

        ArgumentCaptor<PatchNote> captor = ArgumentCaptor.forClass(PatchNote.class);
        verify(patchNoteRepository).save(captor.capture());
        assertThat(response.published()).isTrue();
        assertThat(response.publishedAt()).isNotNull();
        assertThat(captor.getValue().isPublished()).isTrue();
        assertThat(captor.getValue().getPublishedDt()).isNotNull();
    }

    @Test
    void create_rejectsHtmlContainingOnlyBreaksWithBadRequest() {
        PatchNoteRequest request = new PatchNoteRequest("패치노트", "1.0.0", "<p><br></p>", true);

        assertThatThrownBy(() -> service.create(request, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> {
                    ErrorCode errorCode = ((BusinessException) exception).getErrorCode();
                    assertThat(errorCode).isEqualTo(ErrorCode.INVALID_INPUT);
                    assertThat(errorCode.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });
        verify(patchNoteRepository, never()).save(any(PatchNote.class));
    }

    @Test
    void update_rejectsHtmlContainingOnlyEntitiesAndNonBreakingSpacesWithBadRequest() {
        PatchNoteRequest request = new PatchNoteRequest(
                "패치노트", "1.0.0", "<p>&nbsp;&#160;\u00A0</p>", true);

        assertThatThrownBy(() -> service.update(10L, request, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> {
                    ErrorCode errorCode = ((BusinessException) exception).getErrorCode();
                    assertThat(errorCode).isEqualTo(ErrorCode.INVALID_INPUT);
                    assertThat(errorCode.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                });
        verify(patchNoteRepository, never()).findByIdAndDelYn(any(Long.class), any(String.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "<script>alert(1)</script>",
            "<style>body { display: none; }</style>",
            "<template><p>템플릿 본문</p></template>"
    })
    void create_rejectsHtmlContainingOnlyNonRenderedElementContent(String content) {
        PatchNoteRequest request = new PatchNoteRequest("패치노트", "1.0.0", content, true);

        assertThatThrownBy(() -> service.create(request, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));
        verify(patchNoteRepository, never()).save(any(PatchNote.class));
    }

    @Test
    void update_rejectsHtmlContainingOnlyZeroWidthCharacters() {
        PatchNoteRequest request = new PatchNoteRequest(
                "패치노트", "1.0.0", "<p>\u200B\u200C\u200D\u2060\uFEFF</p>", true);

        assertThatThrownBy(() -> service.update(10L, request, ADMIN_EMAIL))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.INVALID_INPUT));
        verify(patchNoteRepository, never()).findByIdAndDelYn(any(Long.class), any(String.class));
    }

    @Test
    void create_acceptsFormattedHtmlContainingVisibleText() {
        PatchNoteRequest request = new PatchNoteRequest(
                "패치노트", "1.0.0", "<p><strong>본문</strong></p>", false);

        PatchNoteResponse response = service.create(request, ADMIN_EMAIL);

        assertThat(response.content()).isEqualTo("<p><strong>본문</strong></p>");
        verify(patchNoteRepository).save(any(PatchNote.class));
    }

    @Test
    void updatePublication_setsFirstPublishedAt() {
        PatchNote patchNote = patchNote(false);
        when(patchNoteRepository.findByIdAndDelYn(10L, "N")).thenReturn(Optional.of(patchNote));

        PatchNoteResponse response = service.updatePublication(
                10L, new PatchNotePublicationRequest(true), ADMIN_EMAIL);

        assertThat(response.published()).isTrue();
        assertThat(patchNote.getPublishedDt()).isNotNull();
        assertThat(patchNote.getModifiedUno()).isEqualTo(ADMIN_ID);
    }

    @Test
    void updatePublication_keepsFirstPublishedAtAfterUnpublishAndRepublish() {
        PatchNote patchNote = patchNote(false);
        when(patchNoteRepository.findByIdAndDelYn(10L, "N")).thenReturn(Optional.of(patchNote));

        service.updatePublication(10L, new PatchNotePublicationRequest(true), ADMIN_EMAIL);
        LocalDateTime firstPublishedAt = patchNote.getPublishedDt();
        service.updatePublication(10L, new PatchNotePublicationRequest(false), ADMIN_EMAIL);
        service.updatePublication(10L, new PatchNotePublicationRequest(true), ADMIN_EMAIL);

        assertThat(patchNote.isPublished()).isTrue();
        assertThat(patchNote.getPublishedDt()).isEqualTo(firstPublishedAt);
    }

    @Test
    void getPublished_usesOnlyVisiblePublishedRecordsInRepositoryOrder() {
        Pageable pageable = PageRequest.of(0, 10);
        PatchNote published = patchNote(true);
        when(patchNoteRepository.findByDelYnAndUseYnAndPublishedYnOrderByPublishedDtDescIdDesc(
                "N", "Y", "Y", pageable)).thenReturn(new PageImpl<>(List.of(published), pageable, 1));

        Page<PatchNoteResponse> result = service.getPublished(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).published()).isTrue();
        verify(patchNoteRepository).findByDelYnAndUseYnAndPublishedYnOrderByPublishedDtDescIdDesc(
                "N", "Y", "Y", pageable);
        verify(patchNoteRepository, never()).findByDelYnOrderByModifiedDtDescIdDesc(any(String.class), any(Pageable.class));
    }

    @Test
    void adminGetAll_readsOnlyNonDeletedRecordsInModifiedOrder() {
        Pageable pageable = PageRequest.of(0, 10);
        when(patchNoteRepository.findByDelYnOrderByModifiedDtDescIdDesc("N", pageable))
                .thenReturn(new PageImpl<>(List.of(patchNote(false)), pageable, 1));

        Page<PatchNoteResponse> result = service.adminGetAll(pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(patchNoteRepository).findByDelYnOrderByModifiedDtDescIdDesc("N", pageable);
    }

    @Test
    void update_changesContentAndRefreshesAuditWithAdmin() {
        PatchNote patchNote = patchNote(false);
        when(patchNoteRepository.findByIdAndDelYn(10L, "N")).thenReturn(Optional.of(patchNote));
        PatchNoteRequest request = new PatchNoteRequest("수정 제목", "1.0.1", "<p>수정 본문</p>", true);

        PatchNoteResponse response = service.update(10L, request, ADMIN_EMAIL);

        assertThat(response.title()).isEqualTo("수정 제목");
        assertThat(response.published()).isTrue();
        assertThat(patchNote.getContent()).isEqualTo("<p>수정 본문</p>");
        assertThat(patchNote.getModifiedUno()).isEqualTo(ADMIN_ID);
        assertThat(patchNote.getPublishedDt()).isNotNull();
    }

    @Test
    void delete_softDeletesWithAdminAudit() {
        PatchNote patchNote = patchNote(false);
        when(patchNoteRepository.findByIdAndDelYn(10L, "N")).thenReturn(Optional.of(patchNote));

        service.delete(10L, ADMIN_EMAIL);

        assertThat(patchNote.getDelYn()).isEqualTo("Y");
        assertThat(patchNote.getModifiedUno()).isEqualTo(ADMIN_ID);
    }

    @Test
    void adminGetOne_throwsWhenPatchNoteIsDeleted() {
        when(patchNoteRepository.findByIdAndDelYn(10L, "N")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.adminGetOne(10L))
                .isInstanceOf(BusinessException.class)
                .satisfies(exception -> assertThat(((BusinessException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.PATCH_NOTE_NOT_FOUND));
    }

    private PatchNoteRequest request(boolean published) {
        return new PatchNoteRequest("패치노트", "1.0.0", "<p>본문</p>", published);
    }

    private PatchNote patchNote(boolean published) {
        PatchNote patchNote = PatchNote.builder()
                .title("기존 제목")
                .version("0.9.0")
                .content("<p>기존 본문</p>")
                .createdByUno(ADMIN_ID)
                .build();
        if (published) {
            patchNote.changePublication(true, ADMIN_ID);
        }
        return patchNote;
    }
}
