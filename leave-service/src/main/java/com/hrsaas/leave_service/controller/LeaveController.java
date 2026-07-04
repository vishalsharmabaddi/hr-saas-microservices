package com.hrsaas.leave_service.controller;

import com.hrsaas.leave_service.client.EmployeeClient;
import com.hrsaas.leave_service.dto.EmployeeDTO;
import com.hrsaas.leave_service.producer.LeaveEventProducer;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final EmployeeClient employeeClient;
    private final LeaveEventProducer leaveEventProducer;

    @RateLimiter(name = "employeeServiceRL", fallbackMethod = "employeeFallback")
    @Bulkhead(name = "employeeServiceBH", fallbackMethod = "employeeFallback")
    @CircuitBreaker(name = "employeeServiceCB", fallbackMethod = "employeeFallback")
    @Retry(name = "employeeServiceRetry", fallbackMethod = "employeeFallback")
    @GetMapping("/check/{employeeId}")
    public ResponseEntity<String> checkEmployee(@PathVariable Long employeeId) {
        EmployeeDTO employee = employeeClient.getEmployeeById(employeeId);
        return ResponseEntity.ok("Employee found: " + employee.getFirstName() + " " + employee.getLastName());
    }

    public ResponseEntity<String> employeeFallback(Long employeeId, Exception ex) {
        return ResponseEntity.ok("Employee service unavailable. Please try again later.");
    }

    @PostMapping("/approve/{employeeId}")
    public ResponseEntity<String> approveLeave(@PathVariable Long employeeId) {
        EmployeeDTO employee = employeeClient.getEmployeeById(employeeId);
        leaveEventProducer.sendLeaveApprovedEvent(employeeId, employee.getFirstName());
        return ResponseEntity.ok("Leave approved and event sent for: " + employee.getFirstName());
    }
}