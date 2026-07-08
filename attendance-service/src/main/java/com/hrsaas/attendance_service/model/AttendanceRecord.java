package com.hrsaas.attendance_service.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
    name = "attendance_records",
    uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "employee_id", "attendance_date"})
)
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "check_in_time")
    private LocalDateTime checkInTime;

    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;

    // PRESENT, LATE, HALF_DAY
    private String status = "PRESENT";

    private String notes;

    @PrePersist
    public void prePersist() {
        if (attendanceDate == null) attendanceDate = LocalDate.now();
        if (checkInTime == null) checkInTime = LocalDateTime.now();
        // 10:00 AM ke baad aaya = LATE
        if (checkInTime.getHour() >= 10) status = "LATE";
        else status = "PRESENT";
    }
}
