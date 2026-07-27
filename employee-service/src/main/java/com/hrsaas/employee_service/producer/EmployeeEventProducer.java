package com.hrsaas.employee_service.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmployeeEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOPIC = "employee-updated";

    // Published when an employee's name/email changes. project-service consumes this
    // to keep denormalized member/assignee names in sync (no cross-service reads).
    public void sendEmployeeUpdated(Long companyId, Long employeeId, String email, String fullName) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("companyId", companyId);
            payload.put("employeeId", employeeId);
            payload.put("email", email);
            payload.put("fullName", fullName);
            kafkaTemplate.send(TOPIC, objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            // Kafka unavailable in local dev — log and continue
            log.warn("Kafka event skipped (topic={}): {}", TOPIC, e.getMessage());
        }
    }
}
