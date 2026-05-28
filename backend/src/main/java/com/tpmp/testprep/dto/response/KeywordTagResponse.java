package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.KeywordTag;

public record KeywordTagResponse(Long id, String name, String type, int useCount) {

    public static KeywordTagResponse from(KeywordTag tag) {
        return new KeywordTagResponse(
                tag.getId(), tag.getName(), tag.getType().name(), tag.getUseCount());
    }
}
