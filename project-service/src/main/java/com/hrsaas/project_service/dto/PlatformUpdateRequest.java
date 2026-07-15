package com.hrsaas.project_service.dto;

import lombok.Data;

// Status ({active}) aur plan ({plan}) update dono ke liye — jo field bheji wahi use hoti hai.
@Data
public class PlatformUpdateRequest {
    private Boolean active;
    private String plan;
}
