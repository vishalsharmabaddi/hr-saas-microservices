package com.hrsaas.notification_service.security;

import java.security.Principal;

// WebSocket session ko user ke email se baandhne ke liye chhoti class.
// Spring ka convertAndSendToUser(email, ...) isi getName() se user match karta hai.
public class StompPrincipal implements Principal {

    private final String email;

    public StompPrincipal(String email) {
        this.email = email;
    }

    @Override
    public String getName() {
        return email;
    }
}
