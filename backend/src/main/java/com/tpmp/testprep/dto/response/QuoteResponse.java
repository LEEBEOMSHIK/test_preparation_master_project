package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Quote;

import java.time.LocalDateTime;

public record QuoteResponse(
        Long id,
        String content,
        String author,
        String useYn,
        LocalDateTime createdAt
) {
    public static QuoteResponse from(Quote q) {
        return new QuoteResponse(q.getId(), q.getContent(), q.getAuthor(), q.getUseYn(), q.getCreatedAt());
    }
}
