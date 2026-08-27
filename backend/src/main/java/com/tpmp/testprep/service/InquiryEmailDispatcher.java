package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.InquiryEmailDelivery;
import com.tpmp.testprep.event.InquiryEmailQueuedEvent;
import com.tpmp.testprep.repository.InquiryEmailDeliveryRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class InquiryEmailDispatcher {
    private final InquiryEmailDeliveryRepository deliveryRepository;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    @Value("${spring.mail.host:}")
    private String smtpHost;
    @Value("${app.mail.from-address:}")
    private String fromAddress;

    @Autowired
    public InquiryEmailDispatcher(InquiryEmailDeliveryRepository deliveryRepository,
                                  ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.deliveryRepository = deliveryRepository;
        this.mailSenderProvider = mailSenderProvider;
    }

    public InquiryEmailDispatcher(InquiryEmailDeliveryRepository deliveryRepository,
                                  ObjectProvider<JavaMailSender> mailSenderProvider,
                                  String smtpHost, String fromAddress) {
        this(deliveryRepository, mailSenderProvider);
        this.smtpHost = smtpHost;
        this.fromAddress = fromAddress;
    }

    @Async("inquiryEmailExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(InquiryEmailQueuedEvent event) {
        dispatch(event.deliveryId());
    }

    public void dispatch(Long deliveryId) {
        deliveryRepository.findById(deliveryId).ifPresent(delivery -> {
            if (delivery.getStatus() != InquiryEmailDelivery.Status.PENDING) {
                return;
            }
            if (smtpHost == null || smtpHost.isBlank()) {
                delivery.markFailed("SMTP 서버가 설정되지 않았습니다.");
                return;
            }
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                delivery.markFailed("SMTP 발송기를 사용할 수 없습니다.");
                return;
            }
            try {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setTo(delivery.getRecipientEmail());
                mail.setSubject(delivery.getSubject());
                mail.setText(delivery.getBody());
                if (fromAddress != null && !fromAddress.isBlank()) {
                    mail.setFrom(fromAddress);
                }
                mailSender.send(mail);
                delivery.markSent();
            } catch (RuntimeException exception) {
                delivery.markFailed("메일 전송에 실패했습니다.");
            }
        });
    }
}
