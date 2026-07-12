package com.hrsaas.payroll_service.service;

import com.hrsaas.payroll_service.dto.PolicyRequest;
import com.hrsaas.payroll_service.dto.SalaryStructureRequest;
import com.hrsaas.payroll_service.model.CompanyPayrollPolicy;
import com.hrsaas.payroll_service.model.SalaryStructure;
import com.hrsaas.payroll_service.repository.CompanyPayrollPolicyRepository;
import com.hrsaas.payroll_service.repository.SalaryStructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private final SalaryStructureRepository structureRepo;
    private final CompanyPayrollPolicyRepository policyRepo;

    // null ko ₹0 maan lo (taaki calculation me NullPointer na aaye)
    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    /* ── Salary structure ─────────────────────────────── */

    public Optional<SalaryStructure> getStructure(Long companyId, Long employeeId) {
        return structureRepo.findByCompanyIdAndEmployeeId(companyId, employeeId);
    }

    // Upsert: pehle se ho to update, warna naya banao (companyId/employeeId force)
    public SalaryStructure saveStructure(Long companyId, Long employeeId, SalaryStructureRequest req) {
        SalaryStructure s = structureRepo.findByCompanyIdAndEmployeeId(companyId, employeeId)
                .orElseGet(SalaryStructure::new);
        s.setCompanyId(companyId);
        s.setEmployeeId(employeeId);
        s.setBasic(nz(req.getBasic()));
        s.setHra(nz(req.getHra()));
        s.setSpecialAllowance(nz(req.getSpecialAllowance()));
        s.setPfEnabled(req.isPfEnabled());
        s.setProfessionalTax(nz(req.getProfessionalTax()));
        s.setLopEnabled(req.isLopEnabled());
        return structureRepo.save(s);
    }

    /* ── Company paid-leave policy ────────────────────── */

    // Set na ho to ek default (saved nahi) laut do — UI ko kuch to dikhe
    public CompanyPayrollPolicy getPolicy(Long companyId) {
        return policyRepo.findByCompanyId(companyId)
                .orElseGet(() -> {
                    CompanyPayrollPolicy def = new CompanyPayrollPolicy();
                    def.setCompanyId(companyId);
                    return def;   // paidLeavesPerMonth = 2 (default)
                });
    }

    public CompanyPayrollPolicy savePolicy(Long companyId, PolicyRequest req) {
        CompanyPayrollPolicy p = policyRepo.findByCompanyId(companyId)
                .orElseGet(CompanyPayrollPolicy::new);
        p.setCompanyId(companyId);
        p.setPaidLeavesPerMonth(Math.max(0, req.getPaidLeavesPerMonth()));   // negative na ho
        return policyRepo.save(p);
    }
}
