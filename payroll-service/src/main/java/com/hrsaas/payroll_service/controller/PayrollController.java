package com.hrsaas.payroll_service.controller;

import com.hrsaas.payroll_service.dto.PayrollRunRequest;
import com.hrsaas.payroll_service.dto.PolicyRequest;
import com.hrsaas.payroll_service.dto.SalaryStructureRequest;
import com.hrsaas.payroll_service.model.CompanyPayrollPolicy;
import com.hrsaas.payroll_service.model.Payslip;
import com.hrsaas.payroll_service.model.SalaryStructure;
import com.hrsaas.payroll_service.security.RoleGuard;
import com.hrsaas.payroll_service.service.PayrollService;
import com.hrsaas.payroll_service.service.PayslipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final PayslipService payslipService;

    /* ── Company paid-leave policy ────────────────────── */

    @GetMapping("/policy")
    public ResponseEntity<CompanyPayrollPolicy> getPolicy(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        RoleGuard.requireManager(role);
        return ResponseEntity.ok(payrollService.getPolicy(companyId));
    }

    @PutMapping("/policy")
    public ResponseEntity<CompanyPayrollPolicy> savePolicy(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody PolicyRequest req) {
        RoleGuard.requireManager(role);
        return ResponseEntity.ok(payrollService.savePolicy(companyId, req));
    }

    /* ── Salary structure ─────────────────────────────── */

    @GetMapping("/structure/{employeeId}")
    public ResponseEntity<SalaryStructure> getStructure(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long employeeId) {
        RoleGuard.requireManager(role);
        return payrollService.getStructure(companyId, employeeId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/structure/{employeeId}")
    public ResponseEntity<SalaryStructure> saveStructure(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long employeeId,
            @RequestBody SalaryStructureRequest req) {
        RoleGuard.requireManager(role);
        return ResponseEntity.ok(payrollService.saveStructure(companyId, employeeId, req));
    }

    /* ── Payslip generation ───────────────────────────── */

    // Ek month ke liye payslip(s) banao. body.employeeId null → saare employees.
    @PostMapping("/run")
    public ResponseEntity<List<Payslip>> runPayroll(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody PayrollRunRequest req) {
        RoleGuard.requireManager(role);
        return ResponseEntity.ok(
                payslipService.run(companyId, req.getMonth(), req.getYear(), req.getEmployeeId()));
    }

    // Us month ki saari payslips (admin view)
    @GetMapping("/payslips")
    public ResponseEntity<List<Payslip>> listPayslips(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam int month,
            @RequestParam int year) {
        RoleGuard.requireManager(role);
        return ResponseEntity.ok(payslipService.listForMonth(companyId, month, year));
    }

    /* ── Employee self (identity token se — koi role-check nahi) ──── */

    @GetMapping("/me/payslips")
    public ResponseEntity<List<Payslip>> myPayslips(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(payslipService.myPayslips(companyId));
    }

    @GetMapping("/me/payslips/{id}")
    public ResponseEntity<Payslip> myPayslip(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(payslipService.myPayslip(companyId, id));
    }
}
