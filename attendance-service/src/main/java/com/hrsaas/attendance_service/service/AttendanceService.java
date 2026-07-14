package com.hrsaas.attendance_service.service;

import com.hrsaas.attendance_service.client.EmployeeClient;
import com.hrsaas.attendance_service.dto.AttendanceResponse;
import com.hrsaas.attendance_service.dto.AttendanceUpdateRequest;
import com.hrsaas.attendance_service.dto.CheckInRequest;
import com.hrsaas.attendance_service.dto.CheckOutRequest;
import com.hrsaas.attendance_service.dto.MyAttendanceStatus;
import com.hrsaas.attendance_service.model.AttendanceRecord;
import com.hrsaas.attendance_service.model.CompanyAttendancePolicy;
import com.hrsaas.attendance_service.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeClient employeeClient;
    private final AttendancePolicyService policyService;

    public AttendanceResponse checkIn(Long companyId, CheckInRequest request) {
        // Inter-service call: employee-service se verify karo
        EmployeeClient.EmployeeInfo emp = employeeClient.getEmployee(companyId, request.getEmployeeId());
        if (emp == null || Boolean.FALSE.equals(emp.getIsActive())) {
            throw new RuntimeException("Employee not found or inactive: " + request.getEmployeeId());
        }

        // Aaj pehle se check-in nahi hona chahiye
        if (attendanceRepository.existsByCompanyIdAndEmployeeIdAndAttendanceDate(
                companyId, request.getEmployeeId(), LocalDate.now())) {
            throw new RuntimeException("Employee already checked in today");
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setCompanyId(companyId);
        record.setEmployeeId(request.getEmployeeId());
        record.setNotes(request.getNotes());

        // Status company policy se: start + grace ke baad check-in = LATE
        CompanyAttendancePolicy policy = policyService.getPolicy(companyId);
        LocalDateTime now = LocalDateTime.now();
        record.setCheckInTime(now);
        LocalTime cutoff = policy.getWorkStartTime().plusMinutes(policy.getGraceMinutes());
        record.setStatus(now.toLocalTime().isAfter(cutoff) ? "LATE" : "PRESENT");

        return toResponse(attendanceRepository.save(record), emp.getFullName());
    }

    public AttendanceResponse checkOut(Long companyId, CheckOutRequest request) {
        AttendanceRecord record = attendanceRepository
                .findByCompanyIdAndEmployeeIdAndAttendanceDate(companyId, request.getEmployeeId(), LocalDate.now())
                .orElseThrow(() -> new RuntimeException("No check-in found for today. Check in first."));

        if (record.getCheckOutTime() != null) {
            throw new RuntimeException("Employee already checked out today");
        }

        record.setCheckOutTime(LocalDateTime.now());

        // Policy ke halfDayHours se kam kaam kiya = HALF_DAY
        CompanyAttendancePolicy policy = policyService.getPolicy(companyId);
        long minutes = ChronoUnit.MINUTES.between(record.getCheckInTime(), record.getCheckOutTime());
        if (minutes < policy.getHalfDayHours() * 60L) record.setStatus("HALF_DAY");

        return toResponse(attendanceRepository.save(record), null);
    }

    public List<AttendanceResponse> getTodayRecords(Long companyId) {
        return attendanceRepository
                .findByCompanyIdAndAttendanceDateOrderByCheckInTimeDesc(companyId, LocalDate.now())
                .stream().map(r -> toResponse(r, null)).toList();
    }

    public AttendanceResponse updateRecord(Long companyId, Long id, AttendanceUpdateRequest request) {
        AttendanceRecord record = attendanceRepository.findById(id)
                .filter(r -> r.getCompanyId().equals(companyId))
                .orElseThrow(() -> new RuntimeException("Record not found: " + id));

        if (request.getCheckInTime() != null)  record.setCheckInTime(request.getCheckInTime());
        if (request.getCheckOutTime() != null) record.setCheckOutTime(request.getCheckOutTime());
        if (request.getStatus() != null)       record.setStatus(request.getStatus());
        if (request.getNotes() != null)        record.setNotes(request.getNotes());

        return toResponse(attendanceRepository.save(record), null);
    }

    public List<AttendanceResponse> getRange(Long companyId, LocalDate from, LocalDate to) {
        return attendanceRepository
                .findByCompanyIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(companyId, from, to)
                .stream().map(r -> toResponse(r, null)).toList();
    }

    public List<AttendanceResponse> getEmployeeHistory(Long companyId, Long employeeId) {
        return attendanceRepository
                .findByCompanyIdAndEmployeeIdOrderByAttendanceDateDesc(companyId, employeeId)
                .stream().map(r -> toResponse(r, null)).toList();
    }

    // ─── Self-service: logged-in user apni hi attendance manage kare ──────────
    // employeeId client se NAHI aata — token se resolve hota hai (employee-service /me).

    public MyAttendanceStatus getMyToday(Long companyId) {
        MyAttendanceStatus status = new MyAttendanceStatus();
        EmployeeClient.EmployeeInfo me = employeeClient.getMe();
        if (me == null) {
            status.setEnrolled(false);   // is email ka koi employee record nahi
            return status;
        }
        status.setEnrolled(true);
        status.setEmployeeName(me.getFullName());
        attendanceRepository
                .findByCompanyIdAndEmployeeIdAndAttendanceDate(companyId, me.getId(), LocalDate.now())
                .ifPresent(r -> status.setRecord(toResponse(r, me.getFullName())));
        return status;
    }

    public AttendanceResponse checkInSelf(Long companyId, String notes) {
        EmployeeClient.EmployeeInfo me = resolveMeOrThrow();
        CheckInRequest req = new CheckInRequest();
        req.setEmployeeId(me.getId());
        req.setNotes(notes);
        return checkIn(companyId, req);      // saare guards (duplicate, LATE) reuse
    }

    public AttendanceResponse checkOutSelf(Long companyId) {
        EmployeeClient.EmployeeInfo me = resolveMeOrThrow();
        CheckOutRequest req = new CheckOutRequest();
        req.setEmployeeId(me.getId());
        return checkOut(companyId, req);      // hours + HALF_DAY logic reuse
    }

    private EmployeeClient.EmployeeInfo resolveMeOrThrow() {
        EmployeeClient.EmployeeInfo me = employeeClient.getMe();
        if (me == null) {
            throw new RuntimeException("You're not in the employee directory yet");
        }
        return me;
    }

    private AttendanceResponse toResponse(AttendanceRecord r, String employeeName) {
        AttendanceResponse res = new AttendanceResponse();
        res.setId(r.getId());
        res.setEmployeeId(r.getEmployeeId());
        res.setEmployeeName(employeeName);
        res.setAttendanceDate(r.getAttendanceDate());
        res.setCheckInTime(r.getCheckInTime());
        res.setCheckOutTime(r.getCheckOutTime());
        res.setStatus(r.getStatus());
        res.setNotes(r.getNotes());
        if (r.getCheckInTime() != null && r.getCheckOutTime() != null) {
            long mins = ChronoUnit.MINUTES.between(r.getCheckInTime(), r.getCheckOutTime());
            res.setHoursWorked(Math.round(mins / 60.0 * 10.0) / 10.0);
        }
        return res;
    }
}
