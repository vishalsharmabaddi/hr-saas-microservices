package com.hrsaas.leave_service.controller;

import com.hrsaas.leave_service.client.EmployeeClient;
import com.hrsaas.leave_service.dto.EmployeeDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final EmployeeClient employeeClient;

    @GetMapping("/check/{employeeId}")
    public ResponseEntity<String> checkEmployee(@PathVariable Long employeeId) {
        EmployeeDTO employee = employeeClient.getEmployeeById(employeeId);
        return ResponseEntity.ok("Employee found: " + employee.getFirstName() + " " + employee.getLastName());
    }
}