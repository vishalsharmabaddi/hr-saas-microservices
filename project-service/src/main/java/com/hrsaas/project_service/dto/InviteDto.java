package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Admin ko pending invite wapas (token ke saath — taaki frontend link bana sake)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InviteDto {
    private Long id;
    private String email;
    private String name;
    private String role;
    private String token;        // frontend isse link banata hai: /accept-invite?token=...
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
