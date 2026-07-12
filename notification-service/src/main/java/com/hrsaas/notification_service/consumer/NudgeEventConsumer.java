package com.hrsaas.notification_service.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NudgeEventConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "employee-nudge", groupId = "notification-group")
    public void handleNudge(String message) {
        log.info("Kafka event received ← employee-nudge: {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            Long employeeId   = Long.valueOf(payload.get("employeeId").toString());
            String name       = (String) payload.getOrDefault("employeeName", "Employee");
            String msg        = (String) payload.getOrDefault("message", "Your manager sent you an appreciation!");
            String email      = (String) payload.get("recipientEmail");   // ho to targeted, warna broadcast

            notificationService.saveNotification(1L, employeeId, name, email, "MANAGER_NUDGE", msg);
            log.info("Nudge notification saved for employee: {}", name);
        } catch (Exception e) {
            log.error("Failed to process nudge event: {}", e.getMessage());
        }
    }
}
