package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.TimeLogRequest;
import com.hrsaas.project_service.dto.TimeLogResponse;
import com.hrsaas.project_service.service.TimeLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/api/timelogs")
@RequiredArgsConstructor
public class TimeLogController {

    private final TimeLogService timeLogService;

    @PostMapping
    public ResponseEntity<TimeLogResponse> logTime(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestBody TimeLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(timeLogService.logTime(companyId, email, request));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TimeLogResponse>> getLogsByTask(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(timeLogService.getLogsByTask(companyId, taskId));
    }

    // EOD Report endpoint — employee ka din ka kaam dekho
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TimeLogResponse>> getLogsByEmployee(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(timeLogService.getLogsByEmployee(companyId, employeeId, from, to));
    }
}
