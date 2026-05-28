package com.tpmp.testprep.dto.request;

import java.util.List;

public record KeywordTagBulkRequest(
        List<String> keywords,
        List<String> domains
) {}
