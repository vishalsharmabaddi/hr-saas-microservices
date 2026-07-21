package com.hrsaas.api_gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.List;
import java.util.Set;

@Component
public class JwtGatewayFilter extends OncePerRequestFilter {

    private final SecretKey key;

    public JwtGatewayFilter(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || path.startsWith("/api/auth") || path.startsWith("/actuator")) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing token");
            return;
        }

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(authHeader.substring(7))
                    .getPayload();

            Object companyId = claims.get("companyId");
            if (companyId == null) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "No company in token");
                return;
            }

            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(claims.getSubject(), null, Collections.emptyList())
            );

            Map<String, String> overrides = new HashMap<>();
            overrides.put("x-company-id", String.valueOf(companyId));
            Object role = claims.get("role");
            if (role != null) overrides.put("x-user-role", String.valueOf(role));
            if (claims.getSubject() != null) overrides.put("x-user-email", claims.getSubject());

            chain.doFilter(new HeaderOverrideRequest(request, overrides), response);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
        }
    }

    private static class HeaderOverrideRequest extends HttpServletRequestWrapper {
        private final Map<String, String> overrides;

        HeaderOverrideRequest(HttpServletRequest request, Map<String, String> overrides) {
            super(request);
            this.overrides = overrides;
        }

        @Override
        public String getHeader(String name) {
            String override = overrides.get(name.toLowerCase());
            return override != null ? override : super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            String override = overrides.get(name.toLowerCase());
            if (override != null) return Collections.enumeration(List.of(override));
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            Set<String> names = new HashSet<>(Collections.list(super.getHeaderNames()));
            names.add("X-Company-Id");
            names.add("X-User-Role");
            names.add("X-User-Email");
            return Collections.enumeration(names);
        }
    }
}