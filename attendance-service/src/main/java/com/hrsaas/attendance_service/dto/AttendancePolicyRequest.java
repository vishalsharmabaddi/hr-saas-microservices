package com.hrsaas.attendance_service.dto;

import lombok.Data;

import java.time.LocalTime;

// Admin policy update — sab optional (jo bheja wahi update).
@Data
public class AttendancePolicyRequest {
    private LocalTime workStartTime;
    private LocalTime workEndTime;
    private Integer graceMinutes;
    private Integer halfDayHours;
    private String workingDays;
}
