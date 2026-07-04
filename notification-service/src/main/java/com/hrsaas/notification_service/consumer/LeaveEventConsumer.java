package com.hrsaas.notification_service.consumer;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LeaveEventConsumer {

    @KafkaListener(topics = "leave-approved", groupId = "notification-group")
    public void handleLeaveApproved(String message) {
        log.info("Notification received: {}", message);
        log.info("Sending email/alert to employee...");
    }
}