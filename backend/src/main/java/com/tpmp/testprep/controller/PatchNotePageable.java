package com.tpmp.testprep.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

final class PatchNotePageable {

    static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 50;

    private PatchNotePageable() {}

    static Pageable normalize(Pageable pageable) {
        int page = Math.max(pageable.getPageNumber(), 0);
        int requestedSize = pageable.getPageSize() > 0 ? pageable.getPageSize() : DEFAULT_SIZE;
        int size = Math.min(requestedSize, MAX_SIZE);
        return PageRequest.of(page, size, pageable.getSort());
    }
}
