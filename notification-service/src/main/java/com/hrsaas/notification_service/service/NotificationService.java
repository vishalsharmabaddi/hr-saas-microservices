package com.hrsaas.notification_service.service;

import com.hrsaas.notification_service.dto.NotificationResponse;
import com.hrsaas.notification_service.model.Notification;
import com.hrsaas.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification saveNotification(Long companyId, Long employeeId, String employeeName, String type, String message) {
        Notification n = new Notification();
        n.setCompanyId(companyId);
        n.setEmployeeId(employeeId);
        n.setEmployeeName(employeeName);
        n.setType(type);
        n.setMessage(message);
        Notification saved = notificationRepository.save(n);
        log.info("Notification saved → id:{} type:{} employee:{}", saved.getId(), type, employeeName);
        return saved;
    }

    public List<NotificationResponse> getAll(Long companyId) {
        return notificationRepository
                .findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream().map(this::toResponse).toList();
    }

    public long getUnreadCount(Long companyId) {
        return notificationRepository.countByCompanyIdAndIsRead(companyId, false);
    }

    public void markAsRead(Long companyId, Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getCompanyId().equals(companyId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllRead(Long companyId) {
        notificationRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .forEach(n -> { n.setIsRead(true); notificationRepository.save(n); });
    }

    private NotificationResponse toResponse(Notification n) {
        NotificationResponse res = new NotificationResponse();
        res.setId(n.getId());
        res.setEmployeeId(n.getEmployeeId());
        res.setEmployeeName(n.getEmployeeName());
        res.setType(n.getType());
        res.setMessage(n.getMessage());
        res.setIsRead(n.getIsRead());
        res.setCreatedAt(n.getCreatedAt());
        return res;
    }
}
