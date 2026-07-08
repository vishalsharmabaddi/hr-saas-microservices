package com.hrsaas.attendance_service.repository;

import com.hrsaas.attendance_service.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByCompanyIdAndAttendanceDateOrderByCheckInTimeDesc(Long companyId, LocalDate date);

    List<AttendanceRecord> findByCompanyIdAndEmployeeIdOrderByAttendanceDateDesc(Long companyId, Long employeeId);

    // Date range ke beech ki saari records (trend chart ke liye)
    List<AttendanceRecord> findByCompanyIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(
            Long companyId, LocalDate from, LocalDate to);

    Optional<AttendanceRecord> findByCompanyIdAndEmployeeIdAndAttendanceDate(Long companyId, Long employeeId, LocalDate date);

    boolean existsByCompanyIdAndEmployeeIdAndAttendanceDate(Long companyId, Long employeeId, LocalDate date);
}
