package com.hrsaas.notification_service.config;

import com.hrsaas.notification_service.security.AuthChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// STOMP over WebSocket ka setup.
// - /ws        → yahan browser connect karega (SockJS fallback ke saath)
// - /app       → client se server ko bheje messages ka prefix (abhi use nahi, future)
// - /topic     → broadcast (poori company) subscribe prefix
// - /queue     → per-user private subscribe prefix (/user ke saath)
// - /user      → Spring is prefix se convertAndSendToUser(email,...) ko route karta hai
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthChannelInterceptor authChannelInterceptor;

    // Allowed browser origins for the WebSocket handshake.
    // Comma-separated; defaults to the local dev frontend. Set in prod via config/env.
    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    public WebSocketConfig(AuthChannelInterceptor authChannelInterceptor) {
        this.authChannelInterceptor = authChannelInterceptor;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins.split(","))   // known origins only, not "*"
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setUserDestinationPrefix("/user");
    }

    // Har incoming STOMP message se pehle chalega — CONNECT pe token verify karega.
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
