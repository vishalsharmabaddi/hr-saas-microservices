package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.AuthResponse;
import com.hrsaas.project_service.dto.GoogleAuthRequest;
import com.hrsaas.project_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Frontend login pe yahan token bhejega → verified identity + memberships wapas
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request.getToken()));
    }
}
