package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.Inquiry;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public record InquiryResponse(
        Long id,
        String title,
        String content,
        String status,
        String inquiryType,
        List<String> imageUrls,
        String reply,
        LocalDateTime repliedAt,
        LocalDateTime createdAt,
        Long userId,
        String userName
) {
    public static InquiryResponse from(Inquiry inquiry) {
        List<String> urls = (inquiry.getImageUrls() != null && !inquiry.getImageUrls().isBlank())
                ? Arrays.stream(inquiry.getImageUrls().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList()
                : Collections.emptyList();
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getTitle(),
                inquiry.getContent(),
                inquiry.getStatus().name(),
                inquiry.getInquiryType().name(),
                urls,
                inquiry.getReply(),
                inquiry.getRepliedAt(),
                inquiry.getCreatedAt(),
                inquiry.getUser().getId(),
                inquiry.getUser().getName()
        );
    }
}
