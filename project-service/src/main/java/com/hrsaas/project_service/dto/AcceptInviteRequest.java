package com.hrsaas.project_service.dto;

import lombok.Data;

// Invitee accept karta hai: apna Google login (identity) + invite ka secret token
@Data
public class AcceptInviteRequest {
    private String googleToken;   // kaun accept kar raha hai — verify hoga
    private String inviteToken;   // kaunsa invite — link se aaya secret
}
