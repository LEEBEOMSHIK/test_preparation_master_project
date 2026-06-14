package com.tpmp.testprep.dto.response;

/** Notion 연동 상태 응답 */
public record NotionStatusResponse(
        boolean configured,   // 서버에 client id/secret이 설정되어 있는지
        boolean connected,    // 현재 사용자가 워크스페이스를 연결했는지
        String workspaceName
) {
    public static NotionStatusResponse notConfigured() {
        return new NotionStatusResponse(false, false, null);
    }

    public static NotionStatusResponse disconnected() {
        return new NotionStatusResponse(true, false, null);
    }

    public static NotionStatusResponse connected(String workspaceName) {
        return new NotionStatusResponse(true, true, workspaceName);
    }
}
