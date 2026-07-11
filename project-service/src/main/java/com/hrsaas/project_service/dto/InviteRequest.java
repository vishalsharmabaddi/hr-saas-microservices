package com.hrsaas.project_service.dto;

import lombok.Data;

// Admin kisi email ko company me add karta hai (with role)
@Data
public class InviteRequest {
    private String email;
    private String name;      // optional
    private String role;      // ADMIN | MANAGER | EMPLOYEE
}
