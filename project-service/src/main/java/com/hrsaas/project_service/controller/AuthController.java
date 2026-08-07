package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.AcceptInviteRequest;
import com.hrsaas.project_service.dto.AuthResponse;
import com.hrsaas.project_service.dto.GoogleAuthRequest;
import com.hrsaas.project_service.dto.RegisterCompanyRequest;
import com.hrsaas.project_service.dto.SwitchCompanyRequest;
import com.hrsaas.project_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // Cron-job keep-alive ping ke liye — halka, no-auth, DB touch nahi karta
    // no-transform: Cloudflare/Render edge isko chunk/compress na kare, warna
    // cron-job.org jaise monitors chunked (unknown-size) response ko "too large" maan ke abort kar dete hain
    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok()
                .header("Cache-Control", "no-transform")
                .body("pong");
    }

    // Frontend login pe yahan token bhejega → verified identity + memberships wapas
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> google(@RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request.getToken()));
    }

    // M5 Founder path: naya user apni company banata hai → ADMIN ban jaata hai + naya token
    @PostMapping("/register-company")
    public ResponseEntity<AuthResponse> registerCompany(@RequestBody RegisterCompanyRequest request) {
        return ResponseEntity.ok(
                authService.registerCompany(request.getToken(), request.getCompanyName(), request.getDomain()));
    }

    // Invite accept: Google login + invite token → membership banti hai + naya token
    @PostMapping("/accept-invite")
    public ResponseEntity<AuthResponse> acceptInvite(@RequestBody AcceptInviteRequest request) {
        return ResponseEntity.ok(
                authService.acceptInvite(request.getGoogleToken(), request.getInviteToken()));
    }

    // Multi-company: doosri company me switch → us company ka naya token
    @PostMapping("/switch-company")
    public ResponseEntity<AuthResponse> switchCompany(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody SwitchCompanyRequest request) {
        return ResponseEntity.ok(authService.switchCompany(authHeader, request.getCompanyId()));
    }
}
