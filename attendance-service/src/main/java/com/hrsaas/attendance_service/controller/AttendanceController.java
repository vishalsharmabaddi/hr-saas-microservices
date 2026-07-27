package com.hrsaas.attendance_service.controller;

import com.hrsaas.attendance_service.dto.AttendanceResponse;
import com.hrsaas.attendance_service.dto.AttendanceUpdateRequest;
import com.hrsaas.attendance_service.dto.CheckInRequest;
import com.hrsaas.attendance_service.dto.CheckOutRequest;
import com.hrsaas.attendance_service.dto.AttendancePolicyRequest;
import com.hrsaas.attendance_service.dto.MyAttendanceStatus;
import com.hrsaas.attendance_service.model.CompanyAttendancePolicy;
import com.hrsaas.attendance_service.scheduler.AttendanceScheduler;
import com.hrsaas.attendance_service.security.RoleGuard;
import com.hrsaas.attendance_service.service.AttendancePolicyService;
import com.hrsaas.attendance_service.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AttendancePolicyService policyService;
    private final AttendanceScheduler attendanceScheduler;

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

    // Editing a record is an admin-only action -- previously any authenticated user in the
    // company could tamper with attendance. Role comes from the verified token (X-User-Role).
    @PutMapping("/{id}")
    public ResponseEntity<AttendanceResponse> updateRecord(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id,
            @RequestBody AttendanceUpdateRequest request) {
        RoleGuard.requireAdmin(role);
        return ResponseEntity.ok(attendanceService.updateRecord(companyId, id, request));
    }

    // Deleting a record is also admin-only (destructive). Company-scoped in the service so one
    // tenant can never delete another tenant's record.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        RoleGuard.requireAdmin(role);
        attendanceService.deleteRecord(companyId, id);
        return ResponseEntity.noContent().build();
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

    // ─── Attendance policy (Admin) ──────────────────────────────────────────────

    @GetMapping("/policy")
    public ResponseEntity<CompanyAttendancePolicy> getPolicy(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(policyService.getPolicy(companyId));
    }

    @PutMapping("/policy")
    public ResponseEntity<CompanyAttendancePolicy> savePolicy(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody AttendancePolicyRequest request) {
        RoleGuard.requireAdmin(role);
        return ResponseEntity.ok(policyService.savePolicy(companyId, request));
    }

    // Manual trigger — 11 PM cron ka wait kiye bina absentees mark karo (Admin, testing/on-demand)
    @PostMapping("/run-absent-check")
    public ResponseEntity<Map<String, Object>> runAbsentCheck(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        RoleGuard.requireAdmin(role);
        int created = attendanceScheduler.runAbsentCheck(companyId, LocalDate.now());
        return ResponseEntity.ok(Map.of("markedAbsent", created));
    }
}
