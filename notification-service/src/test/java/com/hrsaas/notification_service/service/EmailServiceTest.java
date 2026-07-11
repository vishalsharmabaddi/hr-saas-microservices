package com.hrsaas.notification_service.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

// EmailService: (1) SMTP available ho → sahi accept-link ke saath email bheje,
//               (2) SMTP na ho → crash na kare (bas log kare).
class EmailServiceTest {

    @Test
    @SuppressWarnings("unchecked")
    void sendsEmailWithAcceptLinkWhenSenderAvailable() {
        JavaMailSender sender = mock(JavaMailSender.class);
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);

        EmailService service = new EmailService(provider, "no-reply@worktrack.local", "http://localhost:5173");
        service.sendInvite("amit@acme.com", "Acme Corp", "EMPLOYEE", "tok-123");

        ArgumentCaptor<SimpleMailMessage> cap = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(cap.capture());
        SimpleMailMessage msg = cap.getValue();

        assertThat(msg.getTo()).containsExactly("amit@acme.com");
        assertThat(msg.getSubject()).contains("Acme Corp");
        assertThat(msg.getText()).contains("http://localhost:5173/accept-invite?token=tok-123");
    }

    @Test
    @SuppressWarnings("unchecked")
    void doesNotThrowWhenSmtpNotConfigured() {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);   // koi mail sender nahi

        EmailService service = new EmailService(provider, "no-reply@worktrack.local", "http://localhost:5173");

        assertThatCode(() -> service.sendInvite("amit@acme.com", "Acme Corp", "EMPLOYEE", "tok-123"))
                .doesNotThrowAnyException();
    }
}
