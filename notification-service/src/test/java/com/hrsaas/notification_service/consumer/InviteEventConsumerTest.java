package com.hrsaas.notification_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.notification_service.service.EmailService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

// Consumer JSON event ko parse karke EmailService ko sahi values ke saath call karta hai.
class InviteEventConsumerTest {

    @Test
    void parsesEventAndTriggersEmail() {
        EmailService emailService = mock(EmailService.class);
        InviteEventConsumer consumer = new InviteEventConsumer(emailService, new ObjectMapper());

        String json = "{\"email\":\"amit@acme.com\",\"name\":\"Amit\","
                + "\"companyName\":\"Acme Corp\",\"role\":\"EMPLOYEE\",\"token\":\"tok-123\"}";

        consumer.handleInviteCreated(json);

        verify(emailService).sendInvite("amit@acme.com", "Acme Corp", "EMPLOYEE", "tok-123");
    }
}
