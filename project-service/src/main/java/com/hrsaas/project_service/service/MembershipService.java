package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.InviteDto;
import com.hrsaas.project_service.dto.MemberDto;
import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.model.Invite;
import com.hrsaas.project_service.model.Membership;
import com.hrsaas.project_service.producer.InviteEventProducer;
import com.hrsaas.project_service.repository.CompanyRepository;
import com.hrsaas.project_service.repository.InviteRepository;
import com.hrsaas.project_service.repository.MembershipRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class MembershipService {

    private static final Set<String> VALID_ROLES = Set.of("ADMIN", "MANAGER", "EMPLOYEE");
    static final String PENDING = "PENDING";

    private final MembershipRepository repo;
    private final InviteRepository inviteRepo;
    private final CompanyRepository companyRepo;
    private final InviteEventProducer inviteEventProducer;

    public MembershipService(MembershipRepository repo, InviteRepository inviteRepo,
                             CompanyRepository companyRepo, InviteEventProducer inviteEventProducer) {
        this.repo = repo;
        this.inviteRepo = inviteRepo;
        this.companyRepo = companyRepo;
        this.inviteEventProducer = inviteEventProducer;
    }

    // ── Active members (accept ho chuke) ──
    public List<MemberDto> listMembers(Long companyId) {
        return repo.findByCompanyId(companyId).stream().map(this::toDto).toList();
    }

    // ── Invite = ek PENDING invite banao (membership abhi NAHI) ──
    public InviteDto createInvite(Long companyId, String invitedBy, String email, String name, String role) {
        String cleanEmail = email == null ? "" : email.trim().toLowerCase();
        if (cleanEmail.isEmpty() || !cleanEmail.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid email is required");
        }
        String cleanRole = validateRole(role);
        // Pehle se active member? → duplicate block
        if (repo.existsByEmailAndCompanyId(cleanEmail, companyId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already a member");
        }
        // Pending invite already hai? → wahi reuse karo (naya nahi banao), warna naya
        Invite inv = inviteRepo.findByEmailAndCompanyIdAndStatus(cleanEmail, companyId, PENDING).orElse(null);
        if (inv == null) {
            inv = new Invite();
            inv.setEmail(cleanEmail);
            inv.setCompanyId(companyId);
            inv.setRole(cleanRole);
            inv.setName(name != null && !name.isBlank() ? name.trim() : null);
            inv.setToken(UUID.randomUUID().toString());   // secret — link me jaata hai
            inv.setStatus(PENDING);
            inv.setInvitedBy(invitedBy);
            inv.setExpiresAt(LocalDateTime.now().plusDays(7));   // 7 din valid
            inv = inviteRepo.save(inv);
        }

        // Phase 2: notification-service ko email bhejne ke liye event (naya ya reuse — dono pe)
        String companyName = companyRepo.findById(companyId).map(Company::getName).orElse("your company");
        inviteEventProducer.sendInviteCreated(inv.getEmail(), inv.getName(), companyName, inv.getRole(), inv.getToken());

        return toInviteDto(inv);
    }

    // ── Admin ke liye: company ke pending invites ──
    public List<InviteDto> listPendingInvites(Long companyId) {
        return inviteRepo.findByCompanyIdAndStatus(companyId, PENDING).stream().map(this::toInviteDto).toList();
    }

    // ── Pending invite cancel karo (tenant check ke saath) ──
    public void revokeInvite(Long companyId, Long inviteId) {
        Invite inv = inviteRepo.findById(inviteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found"));
        if (!inv.getCompanyId().equals(companyId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Invite not found");
        }
        inviteRepo.delete(inv);
    }

    // ── Existing member ka role change (isi company me) ──
    public MemberDto changeRole(Long companyId, Long membershipId, String role) {
        Membership m = findInCompany(companyId, membershipId);
        m.setRole(validateRole(role));
        return toDto(repo.save(m));
    }

    // ── Member remove (isi company me) ──
    public void remove(Long companyId, Long membershipId) {
        Membership m = findInCompany(companyId, membershipId);
        repo.delete(m);
    }

    // ── Helpers ──

    // Membership id se laao, par confirm karo ki wo ISI company ki hai (tenant isolation)
    private Membership findInCompany(Long companyId, Long membershipId) {
        Membership m = repo.findById(membershipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        if (!m.getCompanyId().equals(companyId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found");
        }
        return m;
    }

    private String validateRole(String role) {
        String r = role == null ? "" : role.trim().toUpperCase();
        if (!VALID_ROLES.contains(r)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role");
        }
        return r;
    }

    private MemberDto toDto(Membership m) {
        return new MemberDto(m.getId(), m.getEmail(), m.getName(), m.getRole(), m.getCreatedAt());
    }

    private InviteDto toInviteDto(Invite inv) {
        return new InviteDto(inv.getId(), inv.getEmail(), inv.getName(), inv.getRole(),
                inv.getToken(), inv.getStatus(), inv.getCreatedAt(), inv.getExpiresAt());
    }
}
