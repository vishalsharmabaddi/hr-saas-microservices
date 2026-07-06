package com.hrsaas.notification_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.notification_service.dto.LeaveApprovedEvent;
import com.hrsaas.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveEventConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "leave-approved", groupId = "notification-group")
    public void handleLeaveApproved(String message) {
        log.info("Kafka event received ← leave-approved: {}", message);
        try {
            LeaveApprovedEvent event = objectMapper.readValue(message, LeaveApprovedEvent.class);

            notificationService.saveNotification(
                    event.getCompanyId() != null ? event.getCompanyId() : 1L,
                    event.getEmployeeId(),
                    event.getEmployeeName(),
                    "LEAVE_APPROVED",
                    event.getMessage()
            );

            log.info("Notification saved for employee: {}", event.getEmployeeName());
        } catch (Exception e) {
            log.error("Failed to process leave event: {}", e.getMessage());
        }
    }
}
