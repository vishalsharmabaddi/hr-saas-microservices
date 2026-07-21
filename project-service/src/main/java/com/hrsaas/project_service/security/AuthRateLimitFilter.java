package com.hrsaas.project_service.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

// L2: per-IP rate limiter for the /api/auth/** endpoints (login, invite-accept, etc.).
// Brute-forcing invite tokens or flooding the Google-verify endpoint is throttled per client
// IP, so an abusive IP gets 429s while legitimate users are unaffected.
//
// Storage is an in-memory map, which is correct for a single instance. If project-service is
// ever scaled to multiple instances, move the buckets to a shared store (e.g. Redis) so the
// limit is enforced across the fleet.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final int capacity;
    private final int windowSeconds;

    // One bucket per client IP.
    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(@Value("${app.rate-limit.auth.capacity:10}") int capacity,
                               @Value("${app.rate-limit.auth.window-seconds:60}") int windowSeconds) {
        this.capacity = capacity;
        this.windowSeconds = windowSeconds;
    }

    // Only guard the auth endpoints; everything else skips this filter entirely.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/auth");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        Bucket bucket = buckets.computeIfAbsent(clientIp(request), ip -> newBucket());

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setHeader("Retry-After", String.valueOf(windowSeconds));
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(),
                    "Too many requests, please slow down and try again later.");
        }
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillGreedy(capacity, Duration.ofSeconds(windowSeconds))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    // Behind a proxy/gateway the real client IP is the first entry of X-Forwarded-For;
    // in direct dev traffic there is no such header, so fall back to the socket address.
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
