package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MembershipRepository extends JpaRepository<Membership, Long> {

    // Ek user ki SAARI companies (multi-tenant ke liye — list, single nahi)
    List<Membership> findByEmail(String email);

    // Ek specific user+company ka membership (role nikalne ke liye)
    Optional<Membership> findByEmailAndCompanyId(String email, Long companyId);

    // Duplicate rokne ke liye — pehle se member hai kya?
    boolean existsByEmailAndCompanyId(String email, Long companyId);

    // Ek company ke saare members (team list ke liye)
    List<Membership> findByCompanyId(Long companyId);

    // Platform Console: har company me kitne app users (seats)
    long countByCompanyId(Long companyId);
}
