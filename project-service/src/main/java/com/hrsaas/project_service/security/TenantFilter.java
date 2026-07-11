package com.hrsaas.project_service.security;

import com.hrsaas.project_service.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

// Har request se pehle chalta hai. Token verify karke companyId nikaalta hai aur
// request ko wrap karke X-Company-Id ko token wale value se force kar deta hai.
@Component
public class TenantFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public TenantFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Login (/api/auth) aur health checks pe token nahi chahiye — skip
        if (path.startsWith("/api/auth") || path.startsWith("/actuator")) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing token");
            return;
        }

        try {
            Claims claims = jwtService.parse(authHeader.substring(7));   // "Bearer " hatao
            Object companyId = claims.get("companyId");
            if (companyId == null) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "No company in token");
                return;
            }
            // Token se companyId + role + email force karo (client ke bheje headers ignore)
            Map<String, String> overrides = new HashMap<>();
            overrides.put("x-company-id", String.valueOf(companyId));
            Object role = claims.get("role");
            if (role != null) overrides.put("x-user-role", String.valueOf(role));
            if (claims.getSubject() != null) overrides.put("x-user-email", claims.getSubject());

            HttpServletRequest wrapped = new CompanyHeaderRequest(request, overrides);
            chain.doFilter(wrapped, response);
        } catch (Exception e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
        }
    }
}
