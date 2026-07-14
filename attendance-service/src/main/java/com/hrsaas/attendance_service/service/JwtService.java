package com.hrsaas.attendance_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// Mostly verify. Ek exception: background @Scheduled job ke paas koi user request nahi
// hoti, toh wo apni "system" identity ka short-lived token khud sign karta hai (wahi secret).
@Service
public class JwtService {

    private final SecretKey key;

    public JwtService(@Value("${app.jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // Signature galat / expire → exception. Sirf isi key se signed token pass honge.
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Service-account token: scheduled job employee-service ko call karne ke liye use karta hai.
    // companyId + ADMIN role, 2 min expiry — bas kaam bhar ka.
    public String signSystemToken(Long companyId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject("system@attendance")
                .claim("companyId", companyId)
                .claim("role", "ADMIN")
                .issuedAt(new Date(now))
                .expiration(new Date(now + 120_000))
                .signWith(key)
                .compact();
    }
}
