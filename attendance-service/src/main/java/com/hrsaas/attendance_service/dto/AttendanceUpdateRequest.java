package com.hrsaas.attendance_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AttendanceUpdateRequest {
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String status; // PRESENT, LATE, HALF_DAY
    private String notes;
}
