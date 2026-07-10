package com.hrsaas.project_service.dto;

import lombok.Data;

// Frontend jo bhejta hai: { "token": "<google id token>" }
@Data
public class GoogleAuthRequest {
    private String token;
}
