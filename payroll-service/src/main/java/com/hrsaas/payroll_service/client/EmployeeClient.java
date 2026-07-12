package com.hrsaas.payroll_service.client;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Collections;
import java.util.List;

// employee-service se baat — employee ka naam aur (all-run ke liye) poori list.
@Component
public class EmployeeClient {

    private final RestClient restClient;

    public EmployeeClient(@Value("${app.employee-service-url:http://localhost:8081}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public EmployeeInfo getEmployee(Long companyId, Long employeeId) {
        try {
            return restClient.get()
                    .uri("/api/employees/{id}", employeeId)
                    .header("X-Company-Id", companyId.toString())
                    .headers(this::forwardAuth)
                    .retrieve()
                    .body(EmployeeInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    // "Yeh token wala banda konsa employee hai?" — email se resolve (self-service).
    // null = is email ka koi employee record nahi (not enrolled).
    public EmployeeInfo getMe() {
        try {
            return restClient.get()
                    .uri("/api/employees/me")
                    .headers(this::forwardAuth)
                    .retrieve()
                    .body(EmployeeInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    public List<EmployeeInfo> listEmployees(Long companyId) {
        try {
            List<EmployeeInfo> list = restClient.get()
                    .uri("/api/employees")
                    .header("X-Company-Id", companyId.toString())
                    .headers(this::forwardAuth)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<EmployeeInfo>>() {});
            return list != null ? list : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // End-user ka Bearer token aage forward — warna employee-service 401 dega
    private void forwardAuth(org.springframework.http.HttpHeaders headers) {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            String auth = attrs.getRequest().getHeader("Authorization");
            if (auth != null) headers.set("Authorization", auth);
        }
    }

    @Data
    public static class EmployeeInfo {
        private Long id;
        private String fullName;
        private String email;
        private Boolean isActive;
    }
}
