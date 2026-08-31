package com.tpmp.testprep.config;

import com.tpmp.testprep.entity.EmailTemplateEvent;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DefaultEmailTemplateCatalog {

    public List<Definition> definitions() {
        return List.of(
                new Definition("INQUIRY_ANSWERED_DEFAULT", EmailTemplateEvent.INQUIRY_ANSWERED,
                        "문의 답변 완료 안내",
                        "[TPMP] 문의 답변이 완료되었습니다: {{inquiryTitle}}",
                        "<h2>{{serviceName}} 문의 상태 안내</h2>" +
                                "<p>{{recipientName}}님, 접수하신 문의에 대한 답변이 완료되었습니다.</p>" +
                                "<p><strong>접수 번호</strong>: {{inquiryId}}<br>" +
                                "<strong>접수 유형</strong>: {{inquiryType}}<br>" +
                                "<strong>제목</strong>: {{inquiryTitle}}<br>" +
                                "<strong>현재 상태</strong>: {{statusLabel}}</p>" +
                                "<p><a href=\"{{inquiryDetailUrl}}\">문의 상세에서 답변 확인하기</a></p>" +
                                "<p>이 메일은 상태 변경 안내이며 관리자 답변 내용은 문의 상세에서 확인할 수 있습니다.</p>"),
                new Definition("INQUIRY_COMPLETED_DEFAULT", EmailTemplateEvent.INQUIRY_COMPLETED,
                        "문의 처리 완료 안내",
                        "[TPMP] 문의 처리가 완료되었습니다: {{inquiryTitle}}",
                        "<h2>{{serviceName}} 문의 상태 안내</h2>" +
                                "<p>{{recipientName}}님, 요청하신 사항의 처리가 완료되었습니다.</p>" +
                                "<p><strong>접수 번호</strong>: {{inquiryId}}<br>" +
                                "<strong>접수 유형</strong>: {{inquiryType}}<br>" +
                                "<strong>제목</strong>: {{inquiryTitle}}<br>" +
                                "<strong>현재 상태</strong>: {{statusLabel}}</p>" +
                                "<p><a href=\"{{inquiryDetailUrl}}\">문의 상세 확인하기</a></p>" +
                                "<p>이 메일은 상태 변경 안내이며 관리자 답변 내용과는 별도로 발송되었습니다.</p>"),
                new Definition("INQUIRY_UNABLE_TO_PROCESS_DEFAULT",
                        EmailTemplateEvent.INQUIRY_UNABLE_TO_PROCESS,
                        "문의 처리 불가 안내",
                        "[TPMP] 문의 처리 결과를 안내드립니다: {{inquiryTitle}}",
                        "<h2>{{serviceName}} 문의 상태 안내</h2>" +
                                "<p>{{recipientName}}님, 요청하신 사항을 현재 처리하기 어려워 결과를 안내드립니다.</p>" +
                                "<p><strong>접수 번호</strong>: {{inquiryId}}<br>" +
                                "<strong>접수 유형</strong>: {{inquiryType}}<br>" +
                                "<strong>제목</strong>: {{inquiryTitle}}<br>" +
                                "<strong>현재 상태</strong>: {{statusLabel}}</p>" +
                                "<p><a href=\"{{inquiryDetailUrl}}\">문의 상세 확인하기</a></p>" +
                                "<p>이 메일은 상태 변경 안내이며 상세 사유가 등록된 경우 문의 상세에서 확인할 수 있습니다.</p>"));
    }

    public record Definition(String systemKey, EmailTemplateEvent eventCode, String name,
                             String subjectTemplate, String htmlBody) {
    }
}
