package com.hrsaas.project_service.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.kafka.core.KafkaTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

// Producer sahi topic pe sahi JSON event bhejta hai — bina asli Kafka ke (KafkaTemplate mock).
class InviteEventProducerTest {

    @Test
    @SuppressWarnings("unchecked")
    void sendsInviteCreatedEventWithAllFields() {
        KafkaTemplate<String, String> kafkaTemplate = mock(KafkaTemplate.class);
        InviteEventProducer producer = new InviteEventProducer(kafkaTemplate, new ObjectMapper());

        producer.sendInviteCreated("amit@acme.com", "Amit", "Acme Corp", "EMPLOYEE", "tok-123");

        ArgumentCaptor<String> topic = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> payload = ArgumentCaptor.forClass(String.class);
        verify(kafkaTemplate).send(topic.capture(), payload.capture());

        assertThat(topic.getValue()).isEqualTo("invite-created");
        assertThat(payload.getValue())
                .contains("\"email\":\"amit@acme.com\"")
                .contains("\"companyName\":\"Acme Corp\"")
                .contains("\"role\":\"EMPLOYEE\"")
                .contains("\"token\":\"tok-123\"");
    }
}
