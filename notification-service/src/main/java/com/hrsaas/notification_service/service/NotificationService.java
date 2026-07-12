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

    // recipientEmail = null → broadcast (poori company). Warna sirf usi banda ko.
    public Notification saveNotification(Long companyId, Long employeeId, String employeeName,
                                         String recipientEmail, String type, String message) {
        Notification n = new Notification();
        n.setCompanyId(companyId);
        n.setEmployeeId(employeeId);
        n.setEmployeeName(employeeName);
        n.setRecipientEmail(recipientEmail);
        n.setType(type);
        n.setMessage(message);
        Notification saved = notificationRepository.save(n);
        log.info("Notification saved → id:{} type:{} to:{}", saved.getId(), type,
                recipientEmail != null ? recipientEmail : "(broadcast)");
        return saved;
    }

    // Sirf is user ki + broadcast notifications
    public List<NotificationResponse> getForUser(Long companyId, String email) {
        return notificationRepository
                .findForUser(companyId, email)
                .stream().map(this::toResponse).toList();
    }

    public long getUnreadCount(Long companyId, String email) {
        return notificationRepository.countUnreadForUser(companyId, email);
    }

    public void markAsRead(Long companyId, Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getCompanyId().equals(companyId)) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllRead(Long companyId, String email) {
        notificationRepository.findForUser(companyId, email)
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
