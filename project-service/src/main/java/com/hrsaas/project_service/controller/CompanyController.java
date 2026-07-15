package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.security.RoleGuard;
import com.hrsaas.project_service.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// Tenant-scoped. X-Company-Id and X-User-Role are forced by TenantFilter from the
// verified token, so they cannot be spoofed by the client.
@RefreshScope
@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    // Being authenticated is not the same as being authorised for THIS record.
    // Without this check any logged-in user could read or edit any other tenant's company.
    private static void requireOwnCompany(Long tokenCompanyId, Long requestedId) {
        if (tokenCompanyId == null || !tokenCompanyId.equals(requestedId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This company is not yours");
        }
    }

    @PostMapping
    public ResponseEntity<Company> createCompany(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Company company) {
        RoleGuard.requireAdmin(role);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(companyService.createCompany(company));
    }

    // Returns only the caller's own company. Kept as a list so the existing
    // frontend contract (companies[0]) stays unchanged.
    @GetMapping
    public ResponseEntity<List<Company>> getMyCompany(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(companyService.getMyCompany(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompanyById(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        requireOwnCompany(companyId, id);
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    // Note: updateCompany only copies name/domain/logoUrl, so a tenant admin still
    // cannot flip isActive or upgrade their own plan -- those stay Platform Console only.
    @PutMapping("/{id}")
    public ResponseEntity<Company> updateCompany(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestBody Company company) {
        RoleGuard.requireAdmin(role);
        requireOwnCompany(companyId, id);
        return ResponseEntity.ok(companyService.updateCompany(id, company));
    }
}
