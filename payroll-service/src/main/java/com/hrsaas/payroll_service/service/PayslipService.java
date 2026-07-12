package com.hrsaas.payroll_service.service;

import com.hrsaas.payroll_service.client.AttendanceClient;
import com.hrsaas.payroll_service.client.EmployeeClient;
import com.hrsaas.payroll_service.client.LeaveClient;
import com.hrsaas.payroll_service.model.CompanyPayrollPolicy;
import com.hrsaas.payroll_service.model.Payslip;
import com.hrsaas.payroll_service.model.SalaryStructure;
import com.hrsaas.payroll_service.repository.PayslipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayslipService {

    private final PayslipRepository payslipRepo;
    private final PayrollService payrollService;      // structure + policy
    private final EmployeeClient employeeClient;
    private final AttendanceClient attendanceClient;
    private final LeaveClient leaveClient;

    private static final BigDecimal PF_RATE = new BigDecimal("0.12");
    private static final BigDecimal DAYS_IN_MONTH = new BigDecimal("30");   // LOP divisor (fixed)

    private static BigDecimal round(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    /* ── Public entry: run for one employee or "all" ──────────────── */
    public List<Payslip> run(Long companyId, int month, int year, Long employeeId) {
        if (month < 1 || month > 12 || year < 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid month/year");
        }
        CompanyPayrollPolicy policy = payrollService.getPolicy(companyId);
        List<Payslip> out = new ArrayList<>();

        if (employeeId != null) {
            // Single: structure zaroori — warna admin ko batao
            SalaryStructure s = payrollService.getStructure(companyId, employeeId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Salary structure not set for this employee"));
            out.add(generate(companyId, month, year, s, policy));
        } else {
            // All: sirf un employees ke liye jinki structure set hai (baaki skip)
            for (EmployeeClient.EmployeeInfo e : employeeClient.listEmployees(companyId)) {
                if (e.getId() == null) continue;
                payrollService.getStructure(companyId, e.getId())
                        .ifPresent(s -> out.add(generate(companyId, month, year, s, policy)));
            }
        }
        return out;
    }

    /* ── The calculation — spec ka formula ────────────────────────── */
    private Payslip generate(Long companyId, int month, int year,
                             SalaryStructure s, CompanyPayrollPolicy policy) {
        Long employeeId = s.getEmployeeId();

        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        // Earnings
        BigDecimal basic = s.getBasic();
        BigDecimal hra = s.getHra();
        BigDecimal special = s.getSpecialAllowance();
        BigDecimal gross = basic.add(hra).add(special);

        // PF = basic ka 12% (agar enabled)
        BigDecimal pf = s.isPfEnabled() ? round(basic.multiply(PF_RATE)) : BigDecimal.ZERO;
        BigDecimal profTax = s.getProfessionalTax() == null ? BigDecimal.ZERO : s.getProfessionalTax();

        // Absent din (unauthorized) — hamesha LOP
        int absentDays = countAbsentDays(companyId, employeeId, monthStart, monthEnd);

        // Approved leave din — quota tak paid, uske baad LOP
        int approvedLeaveDays = countApprovedLeaveDays(companyId, employeeId, monthStart, monthEnd);
        int quota = Math.max(0, policy.getPaidLeavesPerMonth());
        int paidLeaveDays = Math.min(approvedLeaveDays, quota);
        int unpaidLeaveDays = Math.max(0, approvedLeaveDays - quota);

        int lopDays = absentDays + unpaidLeaveDays;
        BigDecimal lopAmount = s.isLopEnabled() && lopDays > 0
                ? round(gross.divide(DAYS_IN_MONTH, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(lopDays)))
                : BigDecimal.ZERO;

        BigDecimal totalDeductions = pf.add(profTax).add(lopAmount);
        BigDecimal netPay = gross.subtract(totalDeductions);

        // Employee ka naam (best-effort)
        String name = null;
        EmployeeClient.EmployeeInfo info = employeeClient.getEmployee(companyId, employeeId);
        if (info != null) name = info.getFullName();

        // Upsert — is month ki payslip pehle se ho to overwrite
        Payslip p = payslipRepo
                .findByCompanyIdAndEmployeeIdAndMonthAndYear(companyId, employeeId, month, year)
                .orElseGet(Payslip::new);
        p.setCompanyId(companyId);
        p.setEmployeeId(employeeId);
        p.setEmployeeName(name);
        p.setMonth(month);
        p.setYear(year);
        p.setBasic(basic);
        p.setHra(hra);
        p.setSpecialAllowance(special);
        p.setGrossPay(gross);
        p.setPf(pf);
        p.setProfessionalTax(profTax);
        p.setAbsentDays(absentDays);
        p.setApprovedLeaveDays(approvedLeaveDays);
        p.setPaidLeaveDays(paidLeaveDays);
        p.setUnpaidLeaveDays(unpaidLeaveDays);
        p.setLopDays(lopDays);
        p.setLopAmount(lopAmount);
        p.setTotalDeductions(totalDeductions);
        p.setNetPay(netPay);
        return payslipRepo.save(p);
    }

    private int countAbsentDays(Long companyId, Long employeeId, LocalDate start, LocalDate end) {
        int count = 0;
        for (AttendanceClient.AttendanceRow r : attendanceClient.getEmployeeAttendance(companyId, employeeId)) {
            LocalDate d = r.getAttendanceDate();
            if (d != null && !d.isBefore(start) && !d.isAfter(end)
                    && "ABSENT".equalsIgnoreCase(r.getStatus())) {
                count++;
            }
        }
        return count;
    }

    private int countApprovedLeaveDays(Long companyId, Long employeeId, LocalDate start, LocalDate end) {
        int days = 0;
        for (LeaveClient.LeaveRow l : leaveClient.getEmployeeLeaves(companyId, employeeId)) {
            LocalDate sd = l.getStartDate();
            if (sd != null && !sd.isBefore(start) && !sd.isAfter(end)
                    && "APPROVED".equalsIgnoreCase(l.getStatus())) {
                days += l.getTotalDays() != null ? l.getTotalDays() : 0;
            }
        }
        return days;
    }

    /* ── Reads ────────────────────────────────────────────────────── */
    public List<Payslip> listForMonth(Long companyId, int month, int year) {
        return payslipRepo.findByCompanyIdAndMonthAndYear(companyId, month, year);
    }

    /* ── Employee self (identity token se) ────────────────────────── */

    // Meri saari payslips (nayi pehle). Employee record nahi to khaali list.
    public List<Payslip> myPayslips(Long companyId) {
        EmployeeClient.EmployeeInfo me = employeeClient.getMe();
        if (me == null || me.getId() == null) return List.of();
        return payslipRepo.findByCompanyIdAndEmployeeIdOrderByYearDescMonthDesc(companyId, me.getId());
    }

    // Ek payslip — sirf apni. Dusre ki maangi to 404 (leak na ho).
    public Payslip myPayslip(Long companyId, Long payslipId) {
        EmployeeClient.EmployeeInfo me = employeeClient.getMe();
        Long myId = me != null ? me.getId() : null;
        return payslipRepo.findById(payslipId)
                .filter(p -> p.getCompanyId().equals(companyId)
                        && myId != null && p.getEmployeeId().equals(myId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payslip not found"));
    }
}
