package com.hrsaas.attendance_service.service;

import com.hrsaas.attendance_service.dto.AttendancePolicyRequest;
import com.hrsaas.attendance_service.model.CompanyAttendancePolicy;
import com.hrsaas.attendance_service.repository.CompanyAttendancePolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AttendancePolicyService {

    private final CompanyAttendancePolicyRepository repo;

    // Unset company → in-memory default (saved nahi). Isse status logic ko hamesha ek policy milti hai.
    public CompanyAttendancePolicy getPolicy(Long companyId) {
        return repo.findByCompanyId(companyId).orElseGet(() -> {
            CompanyAttendancePolicy p = new CompanyAttendancePolicy();
            p.setCompanyId(companyId);
            return p;
        });
    }

    public CompanyAttendancePolicy savePolicy(Long companyId, AttendancePolicyRequest req) {
        CompanyAttendancePolicy p = repo.findByCompanyId(companyId).orElseGet(() -> {
            CompanyAttendancePolicy n = new CompanyAttendancePolicy();
            n.setCompanyId(companyId);
            return n;
        });
        if (req.getWorkStartTime() != null) p.setWorkStartTime(req.getWorkStartTime());
        if (req.getWorkEndTime() != null)   p.setWorkEndTime(req.getWorkEndTime());
        if (req.getGraceMinutes() != null)  p.setGraceMinutes(req.getGraceMinutes());
        if (req.getHalfDayHours() != null)  p.setHalfDayHours(req.getHalfDayHours());
        if (req.getWorkingDays() != null)   p.setWorkingDays(req.getWorkingDays());
        return repo.save(p);
    }
}
