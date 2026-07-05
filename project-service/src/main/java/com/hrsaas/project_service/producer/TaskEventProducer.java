package com.hrsaas.project_service.producer;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TaskEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final String TOPIC = "task-assigned";

    public void sendTaskAssignedEvent(Long taskId, Long employeeId, String taskTitle) {
        String message = String.format(
            "{\"taskId\":%d,\"employeeId\":%d,\"taskTitle\":\"%s\"}",
            taskId, employeeId, taskTitle
        );
        kafkaTemplate.send(TOPIC, message);
    }
}
