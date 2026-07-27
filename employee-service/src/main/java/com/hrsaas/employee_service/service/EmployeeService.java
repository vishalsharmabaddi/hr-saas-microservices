package com.hrsaas.employee_service.service;

import com.hrsaas.employee_service.dto.EmployeeRequest;
import com.hrsaas.employee_service.dto.EmployeeResponse;
import com.hrsaas.employee_service.model.Employee;
import com.hrsaas.employee_service.producer.EmployeeEventProducer;
import com.hrsaas.employee_service.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeEventProducer employeeEventProducer;

    public EmployeeResponse createEmployee(Long companyId, EmployeeRequest request) {
        Employee emp = new Employee();
        emp.setCompanyId(companyId);
        emp.setFirstName(request.getFirstName());
        emp.setLastName(request.getLastName());
        emp.setEmail(request.getEmail());
        emp.setPhone(request.getPhone());
        emp.setDepartment(request.getDepartment());
        emp.setDesignation(request.getDesignation());
        emp.setEmploymentType(request.getEmploymentType() != null ? request.getEmploymentType() : "FULL_TIME");
        emp.setJoiningDate(request.getJoiningDate());
        return toResponse(employeeRepository.save(emp));
    }

    public List<EmployeeResponse> getAllEmployees(Long companyId) {
        return employeeRepository.findByCompanyId(companyId)
                .stream().map(this::toResponse).toList();
    }

    public EmployeeResponse getEmployeeById(Long companyId, Long id) {
        Employee emp = employeeRepository.findById(id)
                .filter(e -> e.getCompanyId().equals(companyId))
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        return toResponse(emp);
    }

    public EmployeeResponse updateEmployee(Long companyId, Long id, EmployeeRequest request) {
        Employee emp = employeeRepository.findById(id)
                .filter(e -> e.getCompanyId().equals(companyId))
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        emp.setFirstName(request.getFirstName());
        emp.setLastName(request.getLastName());
        emp.setEmail(request.getEmail());
        emp.setPhone(request.getPhone());
        emp.setDepartment(request.getDepartment());
        emp.setDesignation(request.getDesignation());
        if (request.getEmploymentType() != null) emp.setEmploymentType(request.getEmploymentType());
        if (request.getJoiningDate() != null) emp.setJoiningDate(request.getJoiningDate());
        Employee saved = employeeRepository.save(emp);
        // Keep denormalized names in project-service (members + task assignees) in sync.
        employeeEventProducer.sendEmployeeUpdated(companyId, saved.getId(), saved.getEmail(),
            saved.getFirstName() + " " + saved.getLastName());
        return toResponse(saved);
    }

    public void deactivateEmployee(Long companyId, Long id) {
        Employee emp = employeeRepository.findById(id)
                .filter(e -> e.getCompanyId().equals(companyId))
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        emp.setIsActive(false);
        employeeRepository.save(emp);
    }

    public void activateEmployee(Long companyId, Long id) {
        Employee emp = employeeRepository.findById(id)
                .filter(e -> e.getCompanyId().equals(companyId))
                .orElseThrow(() -> new RuntimeException("Employee not found: " + id));
        emp.setIsActive(true);
        employeeRepository.save(emp);
    }

    // Self-attendance: logged-in email ko employee record se map karo.
    // Empty = is company me is email ka koi employee nahi (frontend "not enrolled" dikhayega).
    public Optional<EmployeeResponse> getMyProfile(Long companyId, String email) {
        return employeeRepository.findByEmailAndCompanyId(email, companyId)
                .map(this::toResponse);
    }

    private EmployeeResponse toResponse(Employee e) {
        EmployeeResponse res = new EmployeeResponse();
        res.setId(e.getId());
        res.setCompanyId(e.getCompanyId());
        res.setFirstName(e.getFirstName());
        res.setLastName(e.getLastName());
        res.setFullName(e.getFirstName() + " " + e.getLastName());
        res.setEmail(e.getEmail());
        res.setPhone(e.getPhone());
        res.setDepartment(e.getDepartment());
        res.setDesignation(e.getDesignation());
        res.setEmploymentType(e.getEmploymentType());
        res.setIsActive(e.getIsActive());
        res.setJoiningDate(e.getJoiningDate());
        res.setCreatedAt(e.getCreatedAt());
        return res;
    }
}
