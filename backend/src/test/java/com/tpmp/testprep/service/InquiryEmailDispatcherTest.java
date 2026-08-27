package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.Inquiry;
import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InquiryEmailDispatcherTest {

    @Test
    void dispatchMarksDeliverySentAfterSmtpSuccess() {
        InquiryEmailDelivery delivery = delivery();
        InquiryEmailDeliveryRepository repository = mock(InquiryEmailDeliveryRepository.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        ObjectProvider<JavaMailSender> mailSenderProvider = provider(mailSender);
        when(repository.findById(1L)).thenReturn(Optional.of(delivery));
        InquiryEmailDispatcher dispatcher = new InquiryEmailDispatcher(repository, mailSenderProvider, "smtp.tpmp.com", "noreply@tpmp.com");

        dispatcher.dispatch(1L);

        verify(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
        assertThat(delivery.getStatus()).isEqualTo(InquiryEmailDelivery.Status.SENT);
        assertThat(delivery.getAttemptCount()).isEqualTo(1);
    }

    @Test
    void dispatchMarksDeliveryFailedWhenSmtpIsUnavailable() {
        InquiryEmailDelivery delivery = delivery();
        InquiryEmailDeliveryRepository repository = mock(InquiryEmailDeliveryRepository.class);
        when(repository.findById(1L)).thenReturn(Optional.of(delivery));
        InquiryEmailDispatcher dispatcher = new InquiryEmailDispatcher(repository, provider(null), "", "noreply@tpmp.com");

        dispatcher.dispatch(1L);

        assertThat(delivery.getStatus()).isEqualTo(InquiryEmailDelivery.Status.FAILED);
        assertThat(delivery.getLastError()).doesNotContain("noreply@tpmp.com").hasSizeLessThanOrEqualTo(500);
    }

    @SuppressWarnings("unchecked")
    private ObjectProvider<JavaMailSender> provider(JavaMailSender mailSender) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(mailSender);
        return provider;
    }

    private InquiryEmailDelivery delivery() {
        Inquiry inquiry = Inquiry.builder().user(User.builder().email("user@tpmp.com").password("pw").name("사용자")
                .role(User.Role.USER).build()).title("문의 제목").content("문의 본문")
                .requestType(Inquiry.RequestType.GENERAL_INQUIRY).build();
        return InquiryEmailDelivery.pending(inquiry, null, InquiryEmailDelivery.EventType.NEW_INQUIRY,
                "admin@tpmp.com", "[TPMP] 문의", "본문");
    }
}
