package com.hrsaas.leave_service.controller;

import com.hrsaas.leave_service.dto.ApprovalRequest;
import com.hrsaas.leave_service.dto.LeaveRequestDTO;
import com.hrsaas.leave_service.dto.LeaveResponseDTO;
import com.hrsaas.leave_service.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    // Employee leave apply karta hai
    @PostMapping
    public ResponseEntity<LeaveResponseDTO> applyLeave(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody LeaveRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(leaveService.applyLeave(companyId, request));
    }

    // Manager sabki leaves dekhta hai (optional: ?status=PENDING)
    @GetMapping
    public ResponseEntity<List<LeaveResponseDTO>> getAllLeaves(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(leaveService.getAllLeaves(companyId, status));
    }

    // Specific employee ki leaves
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveResponseDTO>> getEmployeeLeaves(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getEmployeeLeaves(companyId, employeeId));
    }

    // Manager approve karta hai → Kafka event fire hoga
    @PutMapping("/{id}/approve")
    public ResponseEntity<LeaveResponseDTO> approveLeave(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalRequest approval) {
        return ResponseEntity.ok(leaveService.approveLeave(companyId, id, approval));
    }

    // Manager reject karta hai
    @PutMapping("/{id}/reject")
    public ResponseEntity<LeaveResponseDTO> rejectLeave(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalRequest approval) {
        return ResponseEntity.ok(leaveService.rejectLeave(companyId, id, approval));
    }
}
