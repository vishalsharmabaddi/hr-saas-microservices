package com.hrsaas.attendance_service.controller;

import com.hrsaas.attendance_service.dto.AttendanceResponse;
import com.hrsaas.attendance_service.dto.AttendanceUpdateRequest;
import com.hrsaas.attendance_service.dto.CheckInRequest;
import com.hrsaas.attendance_service.dto.CheckOutRequest;
import com.hrsaas.attendance_service.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/checkin")
    public ResponseEntity<AttendanceResponse> checkIn(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody CheckInRequest request) {
        return ResponseEntity.ok(attendanceService.checkIn(companyId, request));
    }

    @PostMapping("/checkout")
    public ResponseEntity<AttendanceResponse> checkOut(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody CheckOutRequest request) {
        return ResponseEntity.ok(attendanceService.checkOut(companyId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AttendanceResponse> updateRecord(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id,
            @RequestBody AttendanceUpdateRequest request) {
        return ResponseEntity.ok(attendanceService.updateRecord(companyId, id, request));
    }

    @GetMapping("/today")
    public ResponseEntity<List<AttendanceResponse>> getToday(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(attendanceService.getTodayRecords(companyId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceResponse>> getEmployeeHistory(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getEmployeeHistory(companyId, employeeId));
    }
}
