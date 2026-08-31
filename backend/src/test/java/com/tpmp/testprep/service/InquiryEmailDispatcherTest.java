package com.tpmp.testprep.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

import jakarta.mail.Multipart;
import jakarta.mail.internet.MimeMessage;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InquiryEmailDispatcherTest {

    @Test
    void dispatchMarksDeliverySentAfterSmtpSuccess() {
        InquiryEmailDeliveryProcessor processor = mock(InquiryEmailDeliveryProcessor.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        ObjectProvider<JavaMailSender> mailSenderProvider = provider(mailSender);
        when(processor.claim(1L)).thenReturn(Optional.of(delivery()));
        InquiryEmailDispatcher dispatcher = new InquiryEmailDispatcher(
                processor,
                mailSenderProvider,
                new SyncTaskExecutor(),
                "smtp.tpmp.com",
                "noreply@tpmp.com"
        );

        dispatcher.dispatch(1L);

        verify(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
        verify(processor).markSent(1L);
    }

    @Test
    void dispatcherUsesSimpleMailForLegacyDelivery() {
        InquiryEmailDeliveryProcessor processor = mock(InquiryEmailDeliveryProcessor.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        when(processor.claim(1L)).thenReturn(Optional.of(new InquiryEmailDeliveryProcessor.ClaimedDelivery(
                1L, "user@tpmp.com", "제목", "텍스트", null)));
        InquiryEmailDispatcher dispatcher = dispatcher(processor, mailSender);

        dispatcher.dispatch(1L);

        verify(mailSender).send(any(SimpleMailMessage.class));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void dispatcherUsesMimeMultipartForHtmlDelivery() throws Exception {
        InquiryEmailDeliveryProcessor processor = mock(InquiryEmailDeliveryProcessor.class);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage((jakarta.mail.Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(processor.claim(2L)).thenReturn(Optional.of(new InquiryEmailDeliveryProcessor.ClaimedDelivery(
                2L, "user@tpmp.com", "제목", "텍스트", "<p>HTML</p>")));
        InquiryEmailDispatcher dispatcher = dispatcher(processor, mailSender);

        dispatcher.dispatch(2L);

        verify(mailSender).send(mimeMessage);
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
        Multipart mixed = (Multipart) mimeMessage.getContent();
        Multipart related = (Multipart) mixed.getBodyPart(0).getContent();
        Multipart alternative = (Multipart) related.getBodyPart(0).getContent();
        assertThat(alternative.getCount()).isEqualTo(2);
        assertThat(alternative.getBodyPart(0).getContent()).isEqualTo("텍스트");
        assertThat(alternative.getBodyPart(1).getContent()).isEqualTo("<p>HTML</p>");
    }

    @Test
    void dispatchMarksDeliveryFailedWhenSmtpIsUnavailable() {
        InquiryEmailDeliveryProcessor processor = mock(InquiryEmailDeliveryProcessor.class);
        when(processor.claim(1L)).thenReturn(Optional.of(delivery()));
        InquiryEmailDispatcher dispatcher = new InquiryEmailDispatcher(
                processor,
                provider(null),
                new SyncTaskExecutor(),
                "",
                "noreply@tpmp.com"
        );

        dispatcher.dispatch(1L);

        verify(processor).markFailed(1L, "SMTP 서버가 설정되지 않았습니다.");
    }

    @Test
    void enqueueMarksPendingDeliveryFailedWhenExecutorRejectsTask() {
        InquiryEmailDeliveryProcessor processor = mock(InquiryEmailDeliveryProcessor.class);
        TaskExecutor rejectingExecutor = task -> {
            throw new TaskRejectedException("queue full");
        };
        InquiryEmailDispatcher dispatcher = new InquiryEmailDispatcher(
                processor,
                provider(null),
                rejectingExecutor,
                "smtp.tpmp.com",
                "noreply@tpmp.com"
        );

        dispatcher.enqueue(19L);

        verify(processor).markQueueRejected(19L);
    }

    @SuppressWarnings("unchecked")
    private ObjectProvider<JavaMailSender> provider(JavaMailSender mailSender) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(mailSender);
        return provider;
    }

    private InquiryEmailDeliveryProcessor.ClaimedDelivery delivery() {
        return new InquiryEmailDeliveryProcessor.ClaimedDelivery(
                1L,
                "admin@tpmp.com",
                "[TPMP] 문의",
                "본문",
                null
        );
    }

    private InquiryEmailDispatcher dispatcher(InquiryEmailDeliveryProcessor processor, JavaMailSender mailSender) {
        return new InquiryEmailDispatcher(
                processor,
                provider(mailSender),
                new SyncTaskExecutor(),
                "smtp.tpmp.com",
                "noreply@tpmp.com"
        );
    }
}
