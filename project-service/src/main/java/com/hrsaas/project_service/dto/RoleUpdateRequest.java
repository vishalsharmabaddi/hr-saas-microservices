package com.hrsaas.project_service.dto;

import lombok.Data;

// Existing member ka role badalna
@Data
public class RoleUpdateRequest {
    private String role;      // ADMIN | MANAGER | EMPLOYEE
}
