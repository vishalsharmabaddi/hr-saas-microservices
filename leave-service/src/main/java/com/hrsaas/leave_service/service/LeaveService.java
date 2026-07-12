package com.hrsaas.leave_service.service;

import com.hrsaas.leave_service.client.EmployeeClient;
import com.hrsaas.leave_service.dto.*;
import com.hrsaas.leave_service.model.LeaveRequest;
import com.hrsaas.leave_service.producer.LeaveEventProducer;
import com.hrsaas.leave_service.repository.LeaveRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRepository leaveRepository;
    private final EmployeeClient employeeClient;
    private final LeaveEventProducer leaveEventProducer;

    // Circuit Breaker + Retry — employee-service down hone par fallback chalega
    @CircuitBreaker(name = "employeeServiceCB", fallbackMethod = "createLeaveFallback")
    @Retry(name = "employeeServiceRetry", fallbackMethod = "createLeaveFallback")
    public LeaveResponseDTO applyLeave(Long companyId, LeaveRequestDTO dto) {
        // employee-service se verify karo
        EmployeeDTO emp = employeeClient.getEmployeeById(companyId, dto.getEmployeeId());
        if (emp == null || Boolean.FALSE.equals(emp.getIsActive())) {
            throw new RuntimeException("Employee not found or inactive: " + dto.getEmployeeId());
        }

        LeaveRequest leave = new LeaveRequest();
        leave.setCompanyId(companyId);
        leave.setEmployeeId(dto.getEmployeeId());
        leave.setLeaveType(dto.getLeaveType());
        leave.setStartDate(dto.getStartDate());
        leave.setEndDate(dto.getEndDate());
        leave.setReason(dto.getReason());

        LeaveRequest saved = leaveRepository.save(leave);
        return toResponse(saved, emp.getFullName());
    }

    public LeaveResponseDTO createLeaveFallback(Long companyId, LeaveRequestDTO dto, Exception ex) {
        log.warn("Employee service unavailable, saving leave without verification: {}", ex.getMessage());
        LeaveRequest leave = new LeaveRequest();
        leave.setCompanyId(companyId);
        leave.setEmployeeId(dto.getEmployeeId());
        leave.setLeaveType(dto.getLeaveType());
        leave.setStartDate(dto.getStartDate());
        leave.setEndDate(dto.getEndDate());
        leave.setReason(dto.getReason());
        return toResponse(leaveRepository.save(leave), null);
    }

    public List<LeaveResponseDTO> getAllLeaves(Long companyId, String status) {
        List<LeaveRequest> leaves = (status != null && !status.isBlank())
                ? leaveRepository.findByCompanyIdAndStatusOrderByCreatedAtDesc(companyId, status)
                : leaveRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        return leaves.stream().map(l -> toResponse(l, null)).toList();
    }

    public List<LeaveResponseDTO> getEmployeeLeaves(Long companyId, Long employeeId) {
        return leaveRepository
                .findByCompanyIdAndEmployeeIdOrderByCreatedAtDesc(companyId, employeeId)
                .stream().map(l -> toResponse(l, null)).toList();
    }

    public LeaveResponseDTO approveLeave(Long companyId, Long id, ApprovalRequest approval) {
        LeaveRequest leave = findLeave(companyId, id);
        leave.setStatus("APPROVED");
        leave.setManagerComment(approval != null ? approval.getManagerComment() : null);
        LeaveRequest saved = leaveRepository.save(leave);

        String employeeName = "Employee #" + saved.getEmployeeId();
        String recipientEmail = null;
        try {
            EmployeeDTO emp = employeeClient.getEmployeeById(companyId, saved.getEmployeeId());
            if (emp != null) {
                if (emp.getFullName() != null) employeeName = emp.getFullName();
                recipientEmail = emp.getEmail();   // notification isi applicant ko jaaye
            }
        } catch (Exception e) {
            log.warn("Could not fetch employee for Kafka event: {}", e.getMessage());
        }

        leaveEventProducer.sendLeaveApprovedEvent(
                saved.getEmployeeId(), saved.getCompanyId(),
                employeeName, recipientEmail,
                saved.getId(), saved.getTotalDays());

        return toResponse(saved, null);
    }

    public LeaveResponseDTO rejectLeave(Long companyId, Long id, ApprovalRequest approval) {
        LeaveRequest leave = findLeave(companyId, id);
        leave.setStatus("REJECTED");
        leave.setManagerComment(approval != null ? approval.getManagerComment() : null);
        return toResponse(leaveRepository.save(leave), null);
    }

    private LeaveRequest findLeave(Long companyId, Long id) {
        return leaveRepository.findById(id)
                .filter(l -> l.getCompanyId().equals(companyId))
                .orElseThrow(() -> new RuntimeException("Leave request not found: " + id));
    }

    private LeaveResponseDTO toResponse(LeaveRequest l, String employeeName) {
        LeaveResponseDTO res = new LeaveResponseDTO();
        res.setId(l.getId());
        res.setEmployeeId(l.getEmployeeId());
        res.setEmployeeName(employeeName);
        res.setLeaveType(l.getLeaveType());
        res.setStartDate(l.getStartDate());
        res.setEndDate(l.getEndDate());
        res.setTotalDays(l.getTotalDays());
        res.setReason(l.getReason());
        res.setStatus(l.getStatus());
        res.setManagerComment(l.getManagerComment());
        res.setCreatedAt(l.getCreatedAt());
        return res;
    }
}
