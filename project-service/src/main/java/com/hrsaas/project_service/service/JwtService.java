package com.hrsaas.project_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    // secret + expiry application.yml se aate hain
    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-ms}") long expirationMs) {
        // secret string se HMAC key banti hai (isi se sign + verify dono)
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // Wristband banao: kis-ke liye (email), kaunsi company, kya role
    public String generateToken(String email, Long companyId, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(email)                                   // sub = email
                .claim("companyId", companyId)                    // custom claim
                .claim("role", role)                              // custom claim
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)                                    // humari secret stamp
                .compact();
    }

    // Wristband padho + verify karo. Signature galat / expire → exception phenkta hai.
    // Sirf isi key se signed token pass honge (client forge nahi kar sakta).
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
