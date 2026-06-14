package com.tpmp.testprep.dto.response;

/** 개념노트 Notion 내보내기 결과 */
public record NotionExportResponse(
        String notionPageId,
        String url
) {}
