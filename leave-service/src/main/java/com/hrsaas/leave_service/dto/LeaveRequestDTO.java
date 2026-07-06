package com.hrsaas.leave_service.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class LeaveRequestDTO {
    private Long employeeId;
    private String leaveType;   // SICK, CASUAL, EARNED, UNPAID
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
