package com.hrsaas.gamification_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class TimeLogEvent {
    private Long companyId;         // kaunsi company (tenant isolation)
    private String email;           // kisne log kiya (verified token wala)
    private LocalDate logDate;
    private double hoursLogged;
}
