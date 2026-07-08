package com.hrsaas.gamification_service.repository;

import com.hrsaas.gamification_service.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    List<Badge> findByEmployeeId(Long employeeId);
    boolean existsByEmployeeIdAndBadgeType(Long employeeId, String badgeType);
}
