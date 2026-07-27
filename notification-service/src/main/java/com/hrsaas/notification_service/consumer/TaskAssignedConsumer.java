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
public class TaskAssignedConsumer {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // project-service publishes one event per newly assigned member.
    // We turn each into a targeted WebSocket notification for that assignee.
    @KafkaListener(topics = "task-assigned", groupId = "notification-group")
    public void handleTaskAssigned(String message) {
        log.info("Kafka event received ← task-assigned: {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            Long companyId    = Long.valueOf(payload.get("companyId").toString());
            Long employeeId   = Long.valueOf(payload.get("employeeId").toString());
            String name       = (String) payload.getOrDefault("name", "Team member");
            String email      = (String) payload.get("email");        // recipient — targeted push
            String taskTitle  = (String) payload.getOrDefault("taskTitle", "a task");

            String msg = "You've been assigned to \"" + taskTitle + "\"";
            notificationService.saveNotification(companyId, employeeId, name, email, "TASK_ASSIGNED", msg);
            log.info("Task-assigned notification saved for: {}", email);
        } catch (Exception e) {
            log.error("Failed to process task-assigned event: {}", e.getMessage());
        }
    }
}
