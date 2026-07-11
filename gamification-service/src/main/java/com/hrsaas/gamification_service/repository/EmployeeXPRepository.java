package com.hrsaas.gamification_service.repository;

import com.hrsaas.gamification_service.entity.EmployeeXP;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmployeeXPRepository extends JpaRepository<EmployeeXP, Long> {

    // Ek person ka row — company + email se (verified token wale)
    Optional<EmployeeXP> findByCompanyIdAndEmail(Long companyId, String email);

    // Poori company ka data — team engagement ke liye (sirf isi tenant ka)
    List<EmployeeXP> findByCompanyId(Long companyId);

    // Leaderboard — sirf isi company ke top XP wale
    List<EmployeeXP> findByCompanyIdOrderByTotalXpDesc(Long companyId, Pageable pageable);
}
