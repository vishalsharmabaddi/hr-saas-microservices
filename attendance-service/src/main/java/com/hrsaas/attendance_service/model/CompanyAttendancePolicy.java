package com.hrsaas.attendance_service.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalTime;

// Per-company work schedule. Multi-tenant: har company apna row (companyId unique).
// Isi se LATE / HALF_DAY / working-day decide hota hai.
@Entity
@Table(
    name = "company_attendance_policy",
    uniqueConstraints = @UniqueConstraint(columnNames = "companyId")
)
@Data
public class CompanyAttendancePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    private LocalTime workStartTime = LocalTime.of(9, 0);
    private LocalTime workEndTime   = LocalTime.of(18, 0);

    // start + grace ke baad check-in = LATE
    private int graceMinutes = 15;

    // itne ghante se kam kaam = HALF_DAY
    private int halfDayHours = 4;

    // CSV: MON,TUE,WED,THU,FRI — jis din working day nahi, us din auto-absent skip
    private String workingDays = "MON,TUE,WED,THU,FRI";
}
