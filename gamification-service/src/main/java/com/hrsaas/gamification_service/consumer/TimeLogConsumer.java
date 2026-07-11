package com.hrsaas.gamification_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hrsaas.gamification_service.dto.TimeLogEvent;
import com.hrsaas.gamification_service.service.GamificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeLogConsumer {

    private final GamificationService gamificationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "timelog-submitted", groupId = "gamification-group")
    public void handleTimeLogSubmitted(String message) {
        log.info("Kafka event received ← timelog-submitted: {}", message);
        try {
            objectMapper.registerModule(new JavaTimeModule());
            TimeLogEvent event = objectMapper.readValue(message, TimeLogEvent.class);
            gamificationService.processTimeLog(event.getCompanyId(), event.getEmail(),
                    event.getLogDate(), event.getHoursLogged());
        } catch (Exception e) {
            log.error("Failed to process timelog event: {}", e.getMessage());
        }
    }
}
