package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.UserQuestionBookmark;

import java.time.LocalDateTime;
import java.util.List;

public record BookmarkQuestionResponse(
        Long bookmarkId,
        Long questionBankId,
        String title,
        Integer examYear,
        Integer examRound,
        String content,
        String questionType,
        Long categoryId,
        String categoryName,
        Long examTypeId,
        String examTypeName,
        List<String> options,
        String answer,
        String code,
        String language,
        String explanation,
        LocalDateTime bookmarkedAt
) {
    public static BookmarkQuestionResponse from(UserQuestionBookmark bookmark) {
        var qb = bookmark.getQuestionBank();
        return new BookmarkQuestionResponse(
                bookmark.getId(),
                qb.getId(),
                qb.getTitle(),
                qb.getExamYear(),
                qb.getExamRound(),
                qb.getContent(),
                qb.getQuestionType().name(),
                qb.getCategory() != null ? qb.getCategory().getId() : null,
                qb.getCategory() != null ? qb.getCategory().getName() : null,
                qb.getExamType() != null ? qb.getExamType().getId() : null,
                qb.getExamType() != null ? qb.getExamType().getName() : null,
                qb.getOptions(),
                qb.getAnswer(),
                qb.getCode(),
                qb.getLanguage(),
                qb.getExplanation(),
                bookmark.getCreatedAt()
        );
    }
}
