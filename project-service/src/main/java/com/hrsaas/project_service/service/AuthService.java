package com.hrsaas.project_service.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.hrsaas.project_service.dto.AuthResponse;
import com.hrsaas.project_service.dto.MembershipInfo;
import com.hrsaas.project_service.dto.PendingInviteInfo;
import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.model.Invite;
import com.hrsaas.project_service.model.Membership;
import com.hrsaas.project_service.repository.CompanyRepository;
import com.hrsaas.project_service.repository.InviteRepository;
import com.hrsaas.project_service.repository.MembershipRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class AuthService {

    private static final String PENDING = "PENDING";

    private final MembershipRepository membershipRepository;
    private final CompanyRepository companyRepository;
    private final InviteRepository inviteRepository;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier verifier;

    public AuthService(MembershipRepository membershipRepository,
                       CompanyRepository companyRepository,
                       InviteRepository inviteRepository,
                       JwtService jwtService,
                       @Value("${google.client-id}") String clientId) {
        this.membershipRepository = membershipRepository;
        this.companyRepository = companyRepository;
        this.inviteRepository = inviteRepository;
        this.jwtService = jwtService;
        this.verifier = new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    // ── Google token verify → payload (identity proof). Saare flows isi ko use karte hain. ──
    private GoogleIdToken.Payload verifyGoogle(String idTokenString) {
        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(idTokenString);
        } catch (GeneralSecurityException | IOException | IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token verification failed");
        }
        if (idToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
        return idToken.getPayload();
    }

    // ── Login: verify + memberships + pending invites + humara JWT ──
    public AuthResponse authenticate(String idTokenString) {
        GoogleIdToken.Payload payload = verifyGoogle(idTokenString);
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        List<MembershipInfo> memberships = membershipRepository.findByEmail(email)
                .stream()
                .map(m -> new MembershipInfo(m.getCompanyId(), m.getRole()))
                .toList();

        MembershipInfo primary = memberships.isEmpty() ? null : memberships.get(0);
        Long companyId = primary != null ? primary.getCompanyId() : null;
        String role = primary != null ? primary.getRole() : null;
        String token = jwtService.generateToken(email, companyId, role);

        // Is email ke pending invites — taaki frontend "naya company" ke bajaye "accept" dikha sake
        List<PendingInviteInfo> pending = inviteRepository.findByEmailAndStatus(email, PENDING)
                .stream()
                .map(inv -> new PendingInviteInfo(
                        inv.getToken(),
                        inv.getCompanyId(),
                        companyRepository.findById(inv.getCompanyId()).map(Company::getName).orElse("A company"),
                        inv.getRole()))
                .toList();

        return new AuthResponse(email, name, picture, memberships, token, pending);
    }

    // ── M5 Founder path: nayi company + ADMIN membership (ek transaction me) ──
    @Transactional
    public AuthResponse registerCompany(String idTokenString, String companyName, String domain) {
        GoogleIdToken.Payload payload = verifyGoogle(idTokenString);
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        if (!membershipRepository.findByEmail(email).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already belong to a company");
        }
        if (companyName == null || companyName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Company name is required");
        }
        String cleanName = companyName.trim();
        if (companyRepository.existsByName(cleanName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Company name already taken");
        }

        Company company = new Company();
        company.setName(cleanName);
        company.setDomain(domain != null && !domain.isBlank() ? domain.trim() : null);
        company.setIsActive(true);
        company = companyRepository.save(company);

        Membership membership = new Membership();
        membership.setEmail(email);
        membership.setCompanyId(company.getId());
        membership.setRole("ADMIN");
        membershipRepository.save(membership);

        String token = jwtService.generateToken(email, company.getId(), "ADMIN");
        List<MembershipInfo> memberships = List.of(new MembershipInfo(company.getId(), "ADMIN"));
        return new AuthResponse(email, name, picture, memberships, token, List.of());
    }

    // ── Phase 1: Invite accept — token + email-lock check, tabhi membership banti hai ──
    @Transactional
    public AuthResponse acceptInvite(String googleToken, String inviteToken) {
        GoogleIdToken.Payload payload = verifyGoogle(googleToken);
        String email = payload.getEmail().toLowerCase();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        Invite inv = inviteRepository.findByToken(inviteToken)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found"));

        if (!PENDING.equals(inv.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "This invite is no longer valid");
        }
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "This invite has expired");
        }
        // EMAIL-LOCK — sirf jis email ko invite kiya, wahi accept kar sakta hai
        if (!inv.getEmail().equalsIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This invite is for " + inv.getEmail());
        }

        // Membership banao (agar already nahi hai — double-accept safe)
        if (!membershipRepository.existsByEmailAndCompanyId(email, inv.getCompanyId())) {
            Membership m = new Membership();
            m.setEmail(email);
            m.setCompanyId(inv.getCompanyId());
            m.setRole(inv.getRole());
            m.setName(inv.getName());
            membershipRepository.save(m);
        }
        inv.setStatus("ACCEPTED");
        inviteRepository.save(inv);

        String token = jwtService.generateToken(email, inv.getCompanyId(), inv.getRole());
        List<MembershipInfo> memberships = membershipRepository.findByEmail(email)
                .stream()
                .map(m -> new MembershipInfo(m.getCompanyId(), m.getRole()))
                .toList();
        return new AuthResponse(email, name, picture, memberships, token, List.of());
    }
}
