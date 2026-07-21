package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.AuthResponse;
import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.model.Membership;
import com.hrsaas.project_service.repository.CompanyRepository;
import com.hrsaas.project_service.repository.InviteRepository;
import com.hrsaas.project_service.repository.MembershipRepository;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

// switch-company ki core logic — bina Google/DB ke (repos mock, real JwtService).
class AuthServiceSwitchCompanyTest {

    private static final String TEST_JWT_SECRET = "test-only-jwt-secret-at-least-32-bytes-long";

    private MembershipRepository membershipRepo;
    private CompanyRepository companyRepo;
    private JwtService jwt;
    private AuthService authService;

    @BeforeEach
    void setup() {
        membershipRepo = mock(MembershipRepository.class);
        companyRepo = mock(CompanyRepository.class);
        InviteRepository inviteRepo = mock(InviteRepository.class);
        jwt = new JwtService(TEST_JWT_SECRET, 86400000L);
        authService = new AuthService(membershipRepo, companyRepo, inviteRepo, jwt, "test-client-id");
    }

    private Membership member(Long companyId, String role) {
        Membership m = new Membership();
        m.setEmail("amit@acme.com");
        m.setCompanyId(companyId);
        m.setRole(role);
        return m;
    }

    @Test
    void switchesToACompanyTheUserBelongsTo_issuesTokenForThatCompany() {
        String currentToken = jwt.generateToken("amit@acme.com", 1L, "ADMIN");   // abhi company 1 me
        Membership beta = member(2L, "MANAGER");
        when(membershipRepo.findByEmailAndCompanyId("amit@acme.com", 2L)).thenReturn(Optional.of(beta));
        when(membershipRepo.findByEmail("amit@acme.com")).thenReturn(List.of(member(1L, "ADMIN"), beta));
        when(companyRepo.findById(anyLong())).thenReturn(Optional.of(new Company()));

        AuthResponse res = authService.switchCompany("Bearer " + currentToken, 2L);

        Claims claims = jwt.parse(res.getToken());   // naya token company 2 ka hona chahiye
        assertThat(((Number) claims.get("companyId")).longValue()).isEqualTo(2L);
        assertThat(claims.get("role")).isEqualTo("MANAGER");
    }

    @Test
    void rejectsCompanyTheUserIsNotAMemberOf() {
        String token = jwt.generateToken("amit@acme.com", 1L, "ADMIN");
        when(membershipRepo.findByEmailAndCompanyId("amit@acme.com", 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.switchCompany("Bearer " + token, 99L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void rejectsMissingToken() {
        assertThatThrownBy(() -> authService.switchCompany(null, 2L))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode().value()).isEqualTo(401));
    }
}
