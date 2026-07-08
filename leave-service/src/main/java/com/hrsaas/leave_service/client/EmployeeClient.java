package com.hrsaas.leave_service.client;

import com.hrsaas.leave_service.dto.EmployeeDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "employee-service")
public interface EmployeeClient {

    @GetMapping("/api/employees/{id}")
    EmployeeDTO getEmployeeById(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id);
}
