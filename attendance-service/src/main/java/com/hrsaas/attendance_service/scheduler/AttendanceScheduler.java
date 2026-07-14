package com.hrsaas.attendance_service.scheduler;

import com.hrsaas.attendance_service.client.EmployeeClient;
import com.hrsaas.attendance_service.model.AttendanceRecord;
import com.hrsaas.attendance_service.model.CompanyAttendancePolicy;
import com.hrsaas.attendance_service.repository.AttendanceRepository;
import com.hrsaas.attendance_service.repository.CompanyAttendancePolicyRepository;
import com.hrsaas.attendance_service.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

// Auto-absent: roz raat 11 baje, har configured company ke active employees me se
// jinhone aaj check-in nahi kiya (aur aaj working day tha) → ABSENT mark.
@Slf4j
@Component
@RequiredArgsConstructor
public class AttendanceScheduler {

    private final CompanyAttendancePolicyRepository policyRepo;
    private final AttendanceRepository attendanceRepository;
    private final EmployeeClient employeeClient;
    private final JwtService jwtService;

    // Roz 23:00 (server time)
    @Scheduled(cron = "0 0 23 * * *")
    public void markAbsenteesDaily() {
        LocalDate today = LocalDate.now();
        policyRepo.findAll().stream()
                .map(CompanyAttendancePolicy::getCompanyId)
                .distinct()
                .forEach(companyId -> {
                    try {
                        runAbsentCheck(companyId, today);
                    } catch (Exception e) {
                        log.warn("Auto-absent failed for company {}: {}", companyId, e.getMessage());
                    }
                });
    }

    // Ek company ke liye absentees mark karo. Manual trigger endpoint bhi isi ko call karta hai.
    // Returns: kitne ABSENT records bane.
    public int runAbsentCheck(Long companyId, LocalDate date) {
        CompanyAttendancePolicy policy = policyRepo.findByCompanyId(companyId).orElse(null);
        if (policy == null) return 0;                       // policy set nahi → skip
        if (!isWorkingDay(policy, date)) {
            log.info("Auto-absent: company {} → {} not a working day, skip", companyId, date);
            return 0;
        }

        // System token se roster lao (background job — koi user request nahi)
        String token = jwtService.signSystemToken(companyId);
        List<EmployeeClient.EmployeeInfo> employees = employeeClient.listEmployees(companyId, token);

        int created = 0;
        for (EmployeeClient.EmployeeInfo emp : employees) {
            if (emp.getId() == null || Boolean.FALSE.equals(emp.getIsActive())) continue;
            boolean hasRecord = attendanceRepository
                    .existsByCompanyIdAndEmployeeIdAndAttendanceDate(companyId, emp.getId(), date);
            if (!hasRecord) {
                AttendanceRecord r = new AttendanceRecord();
                r.setCompanyId(companyId);
                r.setEmployeeId(emp.getId());
                r.setAttendanceDate(date);
                r.setStatus("ABSENT");        // koi checkInTime nahi — banda aaya hi nahi
                attendanceRepository.save(r);
                created++;
            }
        }
        log.info("Auto-absent: company {} → {} ABSENT records for {}", companyId, created, date);
        return created;
    }

    // workingDays CSV (MON,TUE,...) me aaj ka din hai ya nahi
    private boolean isWorkingDay(CompanyAttendancePolicy policy, LocalDate date) {
        String today = date.getDayOfWeek().name().substring(0, 3);   // MONDAY → MON
        String days = policy.getWorkingDays() == null ? "" : policy.getWorkingDays().toUpperCase();
        return days.contains(today);
    }
}
