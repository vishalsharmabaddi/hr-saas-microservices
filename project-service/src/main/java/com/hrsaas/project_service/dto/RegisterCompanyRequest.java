package com.hrsaas.project_service.dto;

import lombok.Data;

// Founder onboarding: Google token (identity proof) + nayi company ka naam.
@Data
public class RegisterCompanyRequest {
    private String token;         // Google ID token — kaun bana raha hai, verify hoga
    private String companyName;
    private String domain;        // optional
}
