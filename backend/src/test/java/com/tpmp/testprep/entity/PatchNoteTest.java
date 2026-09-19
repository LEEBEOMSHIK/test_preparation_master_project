package com.tpmp.testprep.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class PatchNoteTest {

    @Test
    void replacingItems_softDeletesPreviousItemsAndKeepsOrder() {
        PatchNote patchNote = PatchNote.builder()
                .title("패치노트")
                .version("v1.0.0")
                .content("<p>본문</p>")
                .createdByUno(1L)
                .build();
        PatchNoteItem previous = PatchNoteItem.builder()
                .itemType(PatchNoteItem.ItemType.ADD)
                .summary("이전")
                .displayOrder(0)
                .createdByUno(1L)
                .build();
        patchNote.addItem(previous);

        patchNote.replaceItems(java.util.List.of(
                PatchNoteItem.builder().itemType(PatchNoteItem.ItemType.FIX).summary("수정")
                        .displayOrder(2).createdByUno(1L).build(),
                PatchNoteItem.builder().itemType(PatchNoteItem.ItemType.SECURITY).summary("보안")
                        .displayOrder(1).createdByUno(1L).build()), 2L);

        assertThat(previous.getDelYn()).isEqualTo("Y");
        assertThat(patchNote.getActiveItems()).extracting(PatchNoteItem::getDisplayOrder)
                .containsExactly(1, 2);
    }

    @Test
    void deletingPatchNote_softDeletesItsItems() {
        PatchNote patchNote = PatchNote.builder()
                .title("패치노트").version("v1.0.0").content("<p>본문</p>").createdByUno(1L).build();
        PatchNoteItem item = PatchNoteItem.builder()
                .itemType(PatchNoteItem.ItemType.FIX).summary("수정").displayOrder(0).createdByUno(1L).build();
        patchNote.addItem(item);

        patchNote.softDelete(2L);

        assertThat(patchNote.getDelYn()).isEqualTo("Y");
        assertThat(item.getDelYn()).isEqualTo("Y");
        assertThat(patchNote.getActiveItems()).isEmpty();
    }

    @Test
    void activeItems_excludesDeactivatedItems() {
        PatchNote patchNote = PatchNote.builder()
                .title("패치노트").version("v1.0.0").content("<p>본문</p>").createdByUno(1L).build();
        PatchNoteItem item = PatchNoteItem.builder()
                .itemType(PatchNoteItem.ItemType.FIX).summary("수정").displayOrder(0).createdByUno(1L).build();
        patchNote.addItem(item);
        item.deactivate(2L);

        assertThat(patchNote.getActiveItems()).isEmpty();
    }

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
