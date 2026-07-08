package com.hrsaas.notification_service.repository;

import com.hrsaas.notification_service.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    long countByCompanyIdAndIsRead(Long companyId, Boolean isRead);
}
