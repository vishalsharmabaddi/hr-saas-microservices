package com.hrsaas.notification_service.dto;

import lombok.Data;

// project-service se "invite-created" event ka shape
@Data
public class InviteCreatedEvent {
    private String email;
    private String name;
    private String companyName;
    private String role;
    private String token;
}
