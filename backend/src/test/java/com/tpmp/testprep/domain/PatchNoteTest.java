package com.tpmp.testprep.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PatchNoteTest {

    @Test
    void 최초_게시_시각은_게시_해제_후_재게시해도_유지된다() {
        PatchNote patchNote = PatchNote.builder()
                .title("패치노트 제목")
                .version("1.0.0")
                .content("<p>내용</p>")
                .createdByUno(1L)
                .build();

        patchNote.changePublication(true, 1L);
        LocalDateTime firstPublishedDt = patchNote.getPublishedDt();

        patchNote.changePublication(false, 1L);
        patchNote.changePublication(true, 1L);

        assertThat(patchNote.isPublished()).isTrue();
        assertThat(patchNote.getPublishedDt()).isEqualTo(firstPublishedDt);
    }

    @Test
    void 수정은_본문과_감사_정보를_갱신한다() {
        PatchNote patchNote = PatchNote.builder()
                .title("기존 제목")
                .version("1.0.0")
                .content("<p>기존 내용</p>")
                .createdByUno(1L)
                .build();

        patchNote.update("수정 제목", "1.0.1", "<p>수정 내용</p>", 2L);

        assertThat(patchNote.getTitle()).isEqualTo("수정 제목");
        assertThat(patchNote.getVersion()).isEqualTo("1.0.1");
        assertThat(patchNote.getContent()).isEqualTo("<p>수정 내용</p>");
        assertThat(patchNote.getModifiedUno()).isEqualTo(2L);
    }
}
