package com.hrsaas.leave_service.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.leave_service.dto.LeaveApprovedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendLeaveApprovedEvent(Long employeeId, Long companyId, String employeeName, Long leaveId, Integer totalDays) {
        // Background thread mein bhejo — Kafka down ho toh HTTP response block na ho
        CompletableFuture.runAsync(() -> {
            try {
                LeaveApprovedEvent event = new LeaveApprovedEvent(
                        employeeId,
                        companyId,
                        employeeName,
                        "Leave approved for " + totalDays + " day(s). Leave ID: " + leaveId
                );
                String json = objectMapper.writeValueAsString(event);
                kafkaTemplate.send("leave-approved", json);
                log.info("Kafka event sent → leave-approved: {}", json);
            } catch (Exception e) {
                log.warn("Kafka not available, event skipped: {}", e.getMessage());
            }
        });
    }
}
