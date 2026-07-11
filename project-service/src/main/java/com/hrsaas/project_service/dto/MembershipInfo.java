package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// User ek company me kya role rakhta hai (multi-tenant: user ke kai ho sakte hain)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembershipInfo {
    private Long companyId;
    private String companyName;   // picker/switcher me naam dikhane ke liye
    private String role;
}
