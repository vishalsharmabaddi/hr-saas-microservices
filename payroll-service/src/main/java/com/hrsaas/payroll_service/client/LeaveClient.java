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

// leave-service se ek employee ki saari leaves; APPROVED + month filter payroll karega.
@Component
public class LeaveClient {

    private final RestClient restClient;

    public LeaveClient(@Value("${app.leave-service-url:http://localhost:8083}") String baseUrl) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public List<LeaveRow> getEmployeeLeaves(Long companyId, Long employeeId) {
        try {
            List<LeaveRow> list = restClient.get()
                    .uri("/api/leaves/employee/{id}", employeeId)
                    .header("X-Company-Id", companyId.toString())
                    .headers(this::forwardAuth)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<LeaveRow>>() {});
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
    public static class LeaveRow {
        private Long employeeId;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer totalDays;
        private String status;   // PENDING, APPROVED, REJECTED
    }
}
