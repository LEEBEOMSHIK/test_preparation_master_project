package com.tpmp.testprep.dto.response;

public record CheckResult(boolean correct, String answer, String explanation, boolean disableAlternativeAnswer) {}
