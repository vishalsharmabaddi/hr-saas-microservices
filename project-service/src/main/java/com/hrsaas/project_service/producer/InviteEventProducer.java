package com.hrsaas.project_service.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

// Invite banne pe Kafka pe event bhejta hai. notification-service ise consume karke email bhejta hai.
// Kafka local dev me down ho to bas log karke aage badhta hai (invite fail nahi hota).
@Slf4j
@Component
@RequiredArgsConstructor
public class InviteEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;      // JSON safe banane ke liye (naam me quotes waghera)

    private static final String TOPIC = "invite-created";

    public void sendInviteCreated(String email, String name, String companyName, String role, String token) {
        try {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("email", email);
            event.put("name", name);
            event.put("companyName", companyName);
            event.put("role", role);
            event.put("token", token);
            kafkaTemplate.send(TOPIC, objectMapper.writeValueAsString(event));
            log.info("Kafka event → invite-created for {}", email);
        } catch (Exception e) {
            log.warn("Kafka event skipped (topic={}): {}", TOPIC, e.getMessage());
        }
    }
}
