package com.hrsaas.payroll_service.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

// attendance-service se ek employee ka poora attendance history.
@Component
public class AttendanceClient {

    private final RestClient restClient;

    public AttendanceClient(@Value("${app.attendance-service-url:http://localhost:8082}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    // Us employee ke saare records; month + ABSENT filter payroll khud karega.
    public List<AttendanceRow> getEmployeeAttendance(Long companyId, Long employeeId) {
        try {
            List<AttendanceRow> list = restClient.get()
                    .uri("/api/attendance/employee/{id}", employeeId)
                    .header("X-Company-Id", companyId.toString())
                    .headers(this::forwardAuth)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<AttendanceRow>>() {});
            return list != null ? list : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private void forwardAuth(org.springframework.http.HttpHeaders headers) {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            String auth = attrs.getRequest().getHeader("Authorization");
            if (auth != null) headers.set("Authorization", auth);
        }
    }

    @Data
    public static class AttendanceRow {
        private Long employeeId;
        private LocalDate attendanceDate;
        private String status;   // PRESENT, LATE, ABSENT, ...
    }
}
