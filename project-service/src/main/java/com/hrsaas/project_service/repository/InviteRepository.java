package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.Invite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InviteRepository extends JpaRepository<Invite, Long> {

    // Accept ke waqt secret token se invite dhoondho
    Optional<Invite> findByToken(String token);

    // Ek company ke pending invites (admin ki list)
    List<Invite> findByCompanyIdAndStatus(Long companyId, String status);

    // Login pe: is email ke pending invites (galti se onboarding na dikhe)
    List<Invite> findByEmailAndStatus(String email, String status);

    // Duplicate rokne ke liye — isi company me isi email ka pending invite already hai?
    Optional<Invite> findByEmailAndCompanyIdAndStatus(String email, Long companyId, String status);
}
