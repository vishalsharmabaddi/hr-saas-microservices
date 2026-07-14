package com.hrsaas.notification_service.security;

import com.hrsaas.notification_service.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

// STOMP CONNECT frame pe "Authorization: Bearer <jwt>" verify karke session ko
// user ke email se baandhta hai. Iske baad server usi user ko private push kar sakta hai.
@Component
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public AuthChannelInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Sirf CONNECT pe auth karo (baaki frames — SUBSCRIBE/SEND — pe nahi)
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing token on WebSocket connect");
            }
            Claims claims = jwtService.parse(authHeader.substring(7)); // invalid → exception → connect reject
            String email = claims.getSubject();
            if (email == null) {
                throw new IllegalArgumentException("No user in token");
            }
            accessor.setUser(new StompPrincipal(email));
        }
        return message;
    }
}
