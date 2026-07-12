package com.hrsaas.notification_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.notification_service.dto.PayslipGeneratedEvent;
import com.hrsaas.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

// payroll-service ka "payslip-generated" event sunta hai → us employee ke liye
// ek TARGETED notification banata hai (recipientEmail set — sabko nahi dikhta).
@Slf4j
@Service
@RequiredArgsConstructor
public class PayslipEventConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "payslip-generated", groupId = "notification-group")
    public void handlePayslipGenerated(String message) {
        log.info("Kafka event received ← payslip-generated: {}", message);
        try {
            PayslipGeneratedEvent event = objectMapper.readValue(message, PayslipGeneratedEvent.class);

            notificationService.saveNotification(
                    event.getCompanyId() != null ? event.getCompanyId() : 1L,
                    event.getEmployeeId(),
                    event.getEmployeeName(),
                    event.getRecipientEmail(),
                    "PAYSLIP_GENERATED",
                    event.getMessage()
            );

            log.info("Payslip notification saved for {}", event.getRecipientEmail());
        } catch (Exception e) {
            log.error("Failed to process payslip event: {}", e.getMessage());
        }
    }
}
