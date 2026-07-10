package com.hrsaas.project_service.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.hrsaas.project_service.dto.AuthResponse;
import com.hrsaas.project_service.dto.MembershipInfo;
import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.model.Membership;
import com.hrsaas.project_service.repository.CompanyRepository;
import com.hrsaas.project_service.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

@Service
public class AuthService {

    private final MembershipRepository membershipRepository;
    private final CompanyRepository companyRepository;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier verifier;

    // Constructor injection — clientId application.yml se aata hai
    public AuthService(MembershipRepository membershipRepository,
                       CompanyRepository companyRepository,
                       JwtService jwtService,
                       @Value("${google.client-id}") String clientId) {
        this.membershipRepository = membershipRepository;
        this.companyRepository = companyRepository;
        this.jwtService = jwtService;
        // Verifier ek hi baar banta hai. setAudience → sirf humare app ke tokens accept honge.
        this.verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    // ── Google token verify → payload (identity proof). Dono flows isi ko use karte hain. ──
    private GoogleIdToken.Payload verifyGoogle(String idTokenString) {
        GoogleIdToken idToken;
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
        return idToken.getPayload();
    }

    // ── Login: verify + memberships lookup + humara JWT ──
    public AuthResponse authenticate(String idTokenString) {
        GoogleIdToken.Payload payload = verifyGoogle(idTokenString);
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        // M1 wali table se — ye email kis-kis company me kya role rakhta hai
        List<MembershipInfo> memberships = membershipRepository.findByEmail(email)
                .stream()
                .map(m -> new MembershipInfo(m.getCompanyId(), m.getRole()))
                .toList();

        // primary company (abhi pehli) ke liye humara signed JWT banao.
        // Koi membership nahi = naya user → companyId/role null → frontend onboarding pe bhejega (M5).
        MembershipInfo primary = memberships.isEmpty() ? null : memberships.get(0);
        Long companyId = primary != null ? primary.getCompanyId() : null;
        String role = primary != null ? primary.getRole() : null;
        String token = jwtService.generateToken(email, companyId, role);

        return new AuthResponse(email, name, picture, memberships, token);
    }

    // ── M5 Founder path: nayi company + ADMIN membership (ek transaction me) ──
    @Transactional
    public AuthResponse registerCompany(String idTokenString, String companyName, String domain) {
        GoogleIdToken.Payload payload = verifyGoogle(idTokenString);
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        // Pehle se kisi company me ho → naya nahi bana sakte (double-founder rokta hai)
        if (!membershipRepository.findByEmail(email).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already belong to a company");
        }
        if (companyName == null || companyName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required");
        }
        String cleanName = companyName.trim();
        // Naam already liya gaya → block. Isse existing company hijack nahi ho sakti.
        if (companyRepository.existsByName(cleanName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Company name already taken");
        }

        // 1) Nayi (khaali) company
        Company company = new Company();
        company.setName(cleanName);
        company.setDomain(domain != null && !domain.isBlank() ? domain.trim() : null);
        company.setIsActive(true);
        company = companyRepository.save(company);      // save ke baad id mil jaati hai

        // 2) Founder us company ka ADMIN (apni hi khaali company ka — safe)
        Membership membership = new Membership();
        membership.setEmail(email);
        membership.setCompanyId(company.getId());
        membership.setRole("ADMIN");
        membershipRepository.save(membership);

        // 3) Naya token isi companyId + ADMIN ke saath
        String token = jwtService.generateToken(email, company.getId(), "ADMIN");
        List<MembershipInfo> memberships = List.of(new MembershipInfo(company.getId(), "ADMIN"));
        return new AuthResponse(email, name, picture, memberships, token);
    }
}
