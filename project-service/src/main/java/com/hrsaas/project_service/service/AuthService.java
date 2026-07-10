package com.hrsaas.project_service.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.hrsaas.project_service.dto.AuthResponse;
import com.hrsaas.project_service.dto.MembershipInfo;
import com.hrsaas.project_service.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

@Service
public class AuthService {

    private final MembershipRepository membershipRepository;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier verifier;

    // Constructor injection — clientId application.yml se aata hai
    public AuthService(MembershipRepository membershipRepository,
                       JwtService jwtService,
                       @Value("${google.client-id}") String clientId) {
        this.membershipRepository = membershipRepository;
        this.jwtService = jwtService;
        // Verifier ek hi baar banta hai. setAudience → sirf humare app ke tokens accept honge.
        this.verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public AuthResponse authenticate(String idTokenString) {
        GoogleIdToken idToken;

        // Step 1: signature + audience + expiry verify (Google ki public keys se)
        // IllegalArgumentException = token ka format hi galat (JWT jaisa nahi) → wo bhi invalid hai
        try {
            idToken = verifier.verify(idTokenString);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token verification failed");
        }
        // null = token nakli / chhera hua / expire / galat audience
        if (idToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }

        // Step 2: verified payload se email/name/picture (client ki baat par nahi — proof par)
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        // Step 3: M1 wali table se — ye email kis-kis company me kya role rakhta hai
        List<MembershipInfo> memberships = membershipRepository.findByEmail(email)
                .stream()
                .map(m -> new MembershipInfo(m.getCompanyId(), m.getRole()))
                .toList();

        // Step 4: primary company (abhi pehli) ke liye humara signed JWT banao.
        // Koi membership nahi = naya user → companyId/role null (aage onboarding/M5).
        MembershipInfo primary = memberships.isEmpty() ? null : memberships.get(0);
        Long companyId = primary != null ? primary.getCompanyId() : null;
        String role = primary != null ? primary.getRole() : null;
        String token = jwtService.generateToken(email, companyId, role);

        return new AuthResponse(email, name, picture, memberships, token);
    }
}
