package com.hrsaas.attendance_service.controller;

import com.hrsaas.attendance_service.dto.AttendanceResponse;
import com.hrsaas.attendance_service.dto.AttendanceUpdateRequest;
import com.hrsaas.attendance_service.dto.CheckInRequest;
import com.hrsaas.attendance_service.dto.CheckOutRequest;
import com.hrsaas.attendance_service.dto.MyAttendanceStatus;
import com.hrsaas.attendance_service.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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

    // ─── Self-service ─────────────────────────────────────────────────────────
    // employeeId body se NAHI aata — token ke email se resolve hota hai.

    @GetMapping("/me/today")
    public ResponseEntity<MyAttendanceStatus> myToday(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(attendanceService.getMyToday(companyId));
    }

    @PostMapping("/me/checkin")
    public ResponseEntity<AttendanceResponse> checkInSelf(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody(required = false) CheckInRequest request) {
        String notes = request != null ? request.getNotes() : null;
        return ResponseEntity.ok(attendanceService.checkInSelf(companyId, notes));
    }

    @PostMapping("/me/checkout")
    public ResponseEntity<AttendanceResponse> checkOutSelf(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(attendanceService.checkOutSelf(companyId));
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

    // Date range — trend chart ke liye. GET /api/attendance?from=2026-06-08&to=2026-07-08
    @GetMapping
    public ResponseEntity<List<AttendanceResponse>> getRange(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(attendanceService.getRange(
                companyId, LocalDate.parse(from), LocalDate.parse(to)));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<AttendanceResponse>> getEmployeeHistory(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(attendanceService.getEmployeeHistory(companyId, employeeId));
    }
}
