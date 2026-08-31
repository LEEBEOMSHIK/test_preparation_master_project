package com.tpmp.testprep.service;

import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.nio.charset.StandardCharsets;

@Component
public class InquiryEmailDispatcher {
    private final InquiryEmailDeliveryProcessor deliveryProcessor;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final TaskExecutor taskExecutor;
    @Value("${spring.mail.host:}")
    private String smtpHost;
    @Value("${app.mail.from-address:}")
    private String fromAddress;

    @Autowired
    public InquiryEmailDispatcher(InquiryEmailDeliveryProcessor deliveryProcessor,
                                  ObjectProvider<JavaMailSender> mailSenderProvider,
                                  @Qualifier("inquiryEmailExecutor") TaskExecutor taskExecutor) {
        this.deliveryProcessor = deliveryProcessor;
        this.mailSenderProvider = mailSenderProvider;
        this.taskExecutor = taskExecutor;
    }

    public InquiryEmailDispatcher(InquiryEmailDeliveryProcessor deliveryProcessor,
                                  ObjectProvider<JavaMailSender> mailSenderProvider,
                                  TaskExecutor taskExecutor,
                                  String smtpHost, String fromAddress) {
        this(deliveryProcessor, mailSenderProvider, taskExecutor);
        this.smtpHost = smtpHost;
        this.fromAddress = fromAddress;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(InquiryEmailQueuedEvent event) {
        enqueue(event.deliveryId());
    }

    public void enqueue(Long deliveryId) {
        try {
            taskExecutor.execute(() -> dispatch(deliveryId));
        } catch (TaskRejectedException exception) {
            deliveryProcessor.markQueueRejected(deliveryId);
        }
    }

    public void dispatch(Long deliveryId) {
        deliveryProcessor.claim(deliveryId).ifPresent(delivery -> {
            if (smtpHost == null || smtpHost.isBlank()) {
                deliveryProcessor.markFailed(deliveryId, "SMTP 서버가 설정되지 않았습니다.");
                return;
            }
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                deliveryProcessor.markFailed(deliveryId, "SMTP 발송기를 사용할 수 없습니다.");
                return;
            }
            try {
                send(mailSender, delivery);
                deliveryProcessor.markSent(deliveryId);
            } catch (RuntimeException | MessagingException exception) {
                deliveryProcessor.markFailed(deliveryId, "메일 전송에 실패했습니다.");
            }
        });
    }

    private void send(JavaMailSender mailSender, InquiryEmailDeliveryProcessor.ClaimedDelivery delivery)
            throws MessagingException {
        if (delivery.htmlBody() == null || delivery.htmlBody().isBlank()) {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(delivery.recipientEmail());
            mail.setSubject(delivery.subject());
            mail.setText(delivery.body());
            if (fromAddress != null && !fromAddress.isBlank()) {
                mail.setFrom(fromAddress);
            }
            mailSender.send(mail);
            return;
        }

        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                mimeMessage, true, StandardCharsets.UTF_8.name());
        helper.setTo(delivery.recipientEmail());
        helper.setSubject(delivery.subject());
        helper.setText(delivery.body(), delivery.htmlBody());
        if (fromAddress != null && !fromAddress.isBlank()) {
            helper.setFrom(fromAddress);
        }
        mailSender.send(mimeMessage);
    }
}
