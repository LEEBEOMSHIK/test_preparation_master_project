package com.tpmp.testprep.service;

public class EmailTemplateRenderingException extends RuntimeException {

    private final Reason reason;

    public EmailTemplateRenderingException(Reason reason, String safeMessage) {
        super(safeMessage);
        this.reason = reason;
    }

    public Reason getReason() {
        return reason;
    }

    public enum Reason {
        INVALID_VARIABLE,
        INVALID_CONTENT
    }
}
