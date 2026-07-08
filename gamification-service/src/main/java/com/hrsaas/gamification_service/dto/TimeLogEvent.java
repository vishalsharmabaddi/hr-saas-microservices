package com.hrsaas.gamification_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class TimeLogEvent {
    private Long employeeId;
    private LocalDate logDate;
    private double hoursLogged;
}
