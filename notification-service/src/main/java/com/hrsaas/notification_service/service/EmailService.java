package com.hrsaas.notification_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// Email bhejta hai. Dev-friendly:
//  - SMTP config NAHI (spring.mail.host missing) → JavaMailSender bean nahi banta →
//    hum bas link log kar dete hain (flow phir bhi testable).
//  - SMTP config HAI → asli email chala jaata hai.
@Slf4j
@Service
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String from;
    private final String frontendUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                        @Value("${app.mail.from:WorkTrack <no-reply@worktrack.local>}") String from,
                        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailSenderProvider = mailSenderProvider;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    public void sendInvite(String toEmail, String companyName, String role, String token) {
        String link = frontendUrl + "/accept-invite?token=" + token;
        String subject = "You've been invited to join " + companyName + " on WorkTrack";
        String body = "Hi,\n\n"
                + "You've been invited to join " + companyName + " on WorkTrack as " + role + ".\n\n"
                + "Accept your invite here (sign in with this email address):\n"
                + link + "\n\n"
                + "This link expires in 7 days.\n\n"
                + "— The WorkTrack Team";

        // Dev me hamesha dikhe — bina SMTP ke bhi link mil jaaye
        log.info("Invite email → to: {} | link: {}", toEmail, link);

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("SMTP not configured (spring.mail.host missing) — email NOT sent, use the link logged above.");
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
            log.info("Invite email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send invite email to {}: {}", toEmail, e.getMessage());
        }
    }
}
