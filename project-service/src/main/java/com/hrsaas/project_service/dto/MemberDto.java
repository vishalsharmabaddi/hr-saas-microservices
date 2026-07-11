package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Team list me frontend ko jo bhejenge (poori entity nahi — sirf zaroori fields)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberDto {
    private Long id;
    private String email;
    private String name;
    private String role;
    private LocalDateTime createdAt;
}
