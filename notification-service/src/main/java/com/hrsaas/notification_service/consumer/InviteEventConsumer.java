package com.hrsaas.notification_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.notification_service.dto.InviteCreatedEvent;
import com.hrsaas.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

// project-service ka "invite-created" event sunta hai → invite email bhejta hai
@Slf4j
@Service
@RequiredArgsConstructor
public class InviteEventConsumer {

    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "invite-created", groupId = "notification-group")
    public void handleInviteCreated(String message) {
        log.info("Kafka event received ← invite-created: {}", message);
        try {
            InviteCreatedEvent event = objectMapper.readValue(message, InviteCreatedEvent.class);
            emailService.sendInvite(event.getEmail(), event.getCompanyName(), event.getRole(), event.getToken());
        } catch (Exception e) {
            log.error("Failed to process invite event: {}", e.getMessage());
        }
    }
}
