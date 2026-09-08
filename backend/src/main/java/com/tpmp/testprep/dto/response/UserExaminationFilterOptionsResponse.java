package com.tpmp.testprep.dto.response;

import java.util.List;

public record UserExaminationFilterOptionsResponse(
        List<Integer> years,
        List<Integer> rounds
) {
}
