package com.hrsaas.notification_service.repository;

import com.hrsaas.notification_service.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    long countByCompanyIdAndIsRead(Long companyId, Boolean isRead);

    // Per-user: meri (recipientEmail = email) YA broadcast (recipientEmail null)
    @Query("SELECT n FROM Notification n WHERE n.companyId = :companyId " +
           "AND (n.recipientEmail = :email OR n.recipientEmail IS NULL) " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findForUser(@Param("companyId") Long companyId, @Param("email") String email);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.companyId = :companyId " +
           "AND n.isRead = false AND (n.recipientEmail = :email OR n.recipientEmail IS NULL)")
    long countUnreadForUser(@Param("companyId") Long companyId, @Param("email") String email);
}
