package com.tpmp.testprep.ai;

public interface LlmTextProvider {
    /**
     * 프롬프트를 LLM에 보내 순수 텍스트 응답을 반환한다.
     * 서비스 불가(키 누락 등) 시 BusinessException(AI_SERVICE_UNAVAILABLE),
     * 호출/파싱 실패 시 BusinessException(AI_ANALYSIS_FAILED)를 던질 수 있다.
     */
    String call(String prompt, int maxTokens);
}
