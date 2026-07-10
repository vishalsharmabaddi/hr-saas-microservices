package com.hrsaas.attendance_service.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
            RestClient.RequestHeadersSpec<?> spec = restClient.get()
                    .uri("/api/employees/{id}", employeeId)
                    .header("X-Company-Id", companyId.toString());

            // End-user ka Bearer token aage forward karo, warna employee-service 401 dega
            String auth = currentAuthHeader();
            if (auth != null) {
                spec = spec.header("Authorization", auth);
            }

            return spec.retrieve().body(EmployeeInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    // Abhi jo request handle ho rahi hai usi ka Authorization header uthao
    private String currentAuthHeader() {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attrs != null ? attrs.getRequest().getHeader("Authorization") : null;
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
