package com.tpmp.testprep.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Optional;

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
                "본문"
        );
    }
}
