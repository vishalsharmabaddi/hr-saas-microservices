package com.hrsaas.gamification_service.repository;

import com.hrsaas.gamification_service.entity.XPHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface XPHistoryRepository extends JpaRepository<XPHistory, Long> {
    List<XPHistory> findByEmployeeIdOrderByLogDateDesc(Long employeeId);
}
