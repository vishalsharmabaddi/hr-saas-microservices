package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.PlatformCompanyResponse;
import com.hrsaas.project_service.dto.PlatformUpdateRequest;
import com.hrsaas.project_service.security.PlatformGuard;
import com.hrsaas.project_service.service.PlatformService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// Cross-tenant, owner-only. Har method email (verified token se) ko owner list se check karta hai.
@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
public class PlatformController {

    private final PlatformService platformService;

    @Value("${app.platform.owner-emails:vishalsharmabaddi@gmail.com}")
    private String ownerEmailsCsv;

    private Set<String> owners() {
        return Arrays.stream(ownerEmailsCsv.split(","))
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @GetMapping("/companies")
    public ResponseEntity<List<PlatformCompanyResponse>> listCompanies(
            @RequestHeader(value = "X-User-Email", required = false) String email) {
        PlatformGuard.requireOwner(email, owners());
        return ResponseEntity.ok(platformService.listCompanies());
    }

    @PutMapping("/companies/{id}/status")
    public ResponseEntity<PlatformCompanyResponse> setStatus(
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @PathVariable Long id,
            @RequestBody PlatformUpdateRequest request) {
        PlatformGuard.requireOwner(email, owners());
        return ResponseEntity.ok(platformService.setStatus(id, request.getActive()));
    }

    @PutMapping("/companies/{id}/plan")
    public ResponseEntity<PlatformCompanyResponse> setPlan(
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @PathVariable Long id,
            @RequestBody PlatformUpdateRequest request) {
        PlatformGuard.requireOwner(email, owners());
        return ResponseEntity.ok(platformService.setPlan(id, request.getPlan()));
    }
}
