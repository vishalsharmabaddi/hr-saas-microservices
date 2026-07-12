package com.hrsaas.employee_service.repository;

import com.hrsaas.employee_service.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByCompanyId(Long companyId);

    List<Employee> findByCompanyIdAndIsActive(Long companyId, Boolean isActive);

    Optional<Employee> findByEmail(String email);

    // Self-attendance: "yeh email + company ka employee kaun hai?" (tenant-safe lookup)
    Optional<Employee> findByEmailAndCompanyId(String email, Long companyId);

    List<Employee> findByDepartment(String department);
}
