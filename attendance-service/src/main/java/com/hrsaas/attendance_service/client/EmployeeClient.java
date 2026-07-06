package com.hrsaas.attendance_service.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class EmployeeClient {

    private final RestClient restClient;

    public EmployeeClient(@Value("${app.employee-service-url:http://localhost:8081}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public EmployeeInfo getEmployee(Long companyId, Long employeeId) {
        try {
            return restClient.get()
                    .uri("/api/employees/{id}", employeeId)
                    .header("X-Company-Id", companyId.toString())
                    .retrieve()
                    .body(EmployeeInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    @Data
    public static class EmployeeInfo {
        private Long id;
        private String fullName;
        private Boolean isActive;
        private String department;
        private String designation;
    }
}
