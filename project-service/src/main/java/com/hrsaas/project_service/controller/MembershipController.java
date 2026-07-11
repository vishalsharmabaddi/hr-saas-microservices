package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.InviteDto;
import com.hrsaas.project_service.dto.InviteRequest;
import com.hrsaas.project_service.dto.MemberDto;
import com.hrsaas.project_service.dto.RoleUpdateRequest;
import com.hrsaas.project_service.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Company team management. companyId, role, email — teeno TenantFilter ne verified token se
// header me daale hain (client ke bheje nahi) — isliye inpe bharosa kar sakte hain.
@RestController
@RequestMapping("/api/team")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService service;

    // Active (accept ho chuke) members
    @GetMapping
    public List<MemberDto> list(@RequestHeader("X-Company-Id") Long companyId) {
        return service.listMembers(companyId);
    }

    // Invite bhejo → pending invite + token wapas (frontend isse link banata hai)
    @PostMapping
    public InviteDto invite(@RequestHeader("X-Company-Id") Long companyId,
                            @RequestHeader(value = "X-User-Role", required = false) String role,
                            @RequestHeader(value = "X-User-Email", required = false) String invitedBy,
                            @RequestBody InviteRequest req) {
        requireAdmin(role);
        return service.createInvite(companyId, invitedBy, req.getEmail(), req.getName(), req.getRole());
    }

    // Pending invites list (admin)
    @GetMapping("/invites")
    public List<InviteDto> pendingInvites(@RequestHeader("X-Company-Id") Long companyId,
                                          @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return service.listPendingInvites(companyId);
    }

    // Pending invite cancel
    @DeleteMapping("/invites/{id}")
    public ResponseEntity<Void> revokeInvite(@RequestHeader("X-Company-Id") Long companyId,
                                             @RequestHeader(value = "X-User-Role", required = false) String role,
                                             @PathVariable Long id) {
        requireAdmin(role);
        service.revokeInvite(companyId, id);
        return ResponseEntity.noContent().build();
    }

    // Existing member ka role change
    @PutMapping("/{id}")
    public MemberDto changeRole(@RequestHeader("X-Company-Id") Long companyId,
                                @RequestHeader(value = "X-User-Role", required = false) String role,
                                @PathVariable Long id,
                                @RequestBody RoleUpdateRequest req) {
        requireAdmin(role);
        return service.changeRole(companyId, id, req.getRole());
    }

    // Member remove
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@RequestHeader("X-Company-Id") Long companyId,
                                       @RequestHeader(value = "X-User-Role", required = false) String role,
                                       @PathVariable Long id) {
        requireAdmin(role);
        service.remove(companyId, id);
        return ResponseEntity.noContent().build();
    }

    // Sirf ADMIN team manage kar sakta hai (frontend guard kaafi nahi — yahan bhi rok)
    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}
