package com.hrsaas.leave_service.producer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void sendLeaveApprovedEvent(Long employeeId, String employeeName) {
        String message = "Leave approved for employee: " + employeeName + " (ID: " + employeeId + ")";
        kafkaTemplate.send("leave-approved", message);
        log.info("Event sent to Kafka: {}", message);
    }
}
