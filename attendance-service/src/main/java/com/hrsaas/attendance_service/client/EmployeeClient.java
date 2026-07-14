package com.hrsaas.attendance_service.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;

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

    // Self-attendance: "yeh token wala banda konsa employee hai?"
    // employee-service /me token ke email se resolve karta hai — hum bas token forward karte hain.
    // null = is email ka koi employee record nahi (404) ya service reachable nahi → "not enrolled".
    public EmployeeInfo getMe() {
        try {
            RestClient.RequestHeadersSpec<?> spec = restClient.get()
                    .uri("/api/employees/me");

            String auth = currentAuthHeader();
            if (auth != null) {
                spec = spec.header("Authorization", auth);
            }

            return spec.retrieve().body(EmployeeInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    // Scheduled job ke liye: poori company ka roster. User request nahi hoti, isliye
    // caller khud system token deta hai (JwtService.signSystemToken se).
    public List<EmployeeInfo> listEmployees(Long companyId, String systemToken) {
        try {
            return restClient.get()
                    .uri("/api/employees")
                    .header("X-Company-Id", companyId.toString())
                    .header("Authorization", "Bearer " + systemToken)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<EmployeeInfo>>() {});
        } catch (Exception e) {
            return List.of();
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
