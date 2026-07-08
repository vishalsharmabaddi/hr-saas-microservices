package com.hrsaas.project_service.client;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "employee-service")
public interface EmployeeClient {

    @GetMapping("/api/employees/{id}")
    EmployeeDTO getEmployeeById(@PathVariable Long id);

    @Data
    class EmployeeDTO {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String department;
    }
}
