package com.hrsaas.employee_service.controller;

import com.hrsaas.employee_service.dto.EmployeeRequest;
import com.hrsaas.employee_service.dto.EmployeeResponse;
import com.hrsaas.employee_service.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import com.hrsaas.employee_service.security.RoleGuard;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody EmployeeRequest request) {
        RoleGuard.requireAdmin(role);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createEmployee(companyId, request));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(employeeService.getAllEmployees(companyId));
    }

    // "Main kaun hoon?" — token ke email se apna employee record. Self-attendance ke liye.
    // Mila → 200 + employee; nahi mila → 404 (frontend "not enrolled" prompt dikhata hai).
    @GetMapping("/me")
    public ResponseEntity<EmployeeResponse> getMyProfile(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader("X-User-Email") String email) {
        return employeeService.getMyProfile(companyId, email)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getEmployeeById(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(companyId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestBody EmployeeRequest request) {
        RoleGuard.requireAdmin(role);
        return ResponseEntity.ok(employeeService.updateEmployee(companyId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        RoleGuard.requireAdmin(role);
        employeeService.deactivateEmployee(companyId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        RoleGuard.requireAdmin(role);
        employeeService.activateEmployee(companyId, id);
        return ResponseEntity.noContent().build();
    }
}
