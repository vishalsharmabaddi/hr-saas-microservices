package com.hrsaas.employee_service.controller;

import com.hrsaas.employee_service.dto.EmployeeRequest;
import com.hrsaas.employee_service.dto.EmployeeResponse;
import com.hrsaas.employee_service.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
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
            @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.createEmployee(companyId, request));
    }

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(employeeService.getAllEmployees(companyId));
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
            @PathVariable Long id,
            @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(companyId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        employeeService.deactivateEmployee(companyId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        employeeService.activateEmployee(companyId, id);
        return ResponseEntity.noContent().build();
    }
}
