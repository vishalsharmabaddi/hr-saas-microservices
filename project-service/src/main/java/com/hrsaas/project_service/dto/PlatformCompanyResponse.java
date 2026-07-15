package com.hrsaas.project_service.dto;

import lombok.Data;

import java.time.LocalDateTime;

// Platform Console ke liye company row + real user count.
@Data
public class PlatformCompanyResponse {
    private Long id;
    private String name;
    private String domain;
    private String plan;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private long userCount;
}
