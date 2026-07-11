package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Login pe frontend ko batata hai: is user ke naam kaunse pending invites hain,
// taaki wo "naya company banao" ke bajaye "accept invite" screen dikha sake.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PendingInviteInfo {
    private String inviteToken;
    private Long companyId;
    private String companyName;
    private String role;
}
