package com.hrsaas.project_service.producer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final String TOPIC = "task-assigned";

    public void sendTaskAssignedEvent(Long taskId, Long employeeId, String taskTitle) {
        try {
            String message = String.format(
                "{\"taskId\":%d,\"employeeId\":%d,\"taskTitle\":\"%s\"}",
                taskId, employeeId, taskTitle
            );
            kafkaTemplate.send(TOPIC, message);
        } catch (Exception e) {
            // Kafka unavailable in local dev — log and continue
            log.warn("Kafka event skipped (topic={}): {}", TOPIC, e.getMessage());
        }
    }
}
