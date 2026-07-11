package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

// Verify hone ke baad frontend ko jo bhejenge.
// memberships khaali ho = naya user (kisi company ka nahi) → aage onboarding/signup (M5).
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String email;
    private String name;
    private String picture;
    private List<MembershipInfo> memberships;
    private String token;              // M3: humara signed JWT (wristband)
    private List<PendingInviteInfo> pendingInvites;   // koi pending invite? (login pe route decide karne ke liye)
}
