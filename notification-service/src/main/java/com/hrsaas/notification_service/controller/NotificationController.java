package com.hrsaas.notification_service.controller;

import com.hrsaas.notification_service.dto.NotificationResponse;
import com.hrsaas.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(notificationService.getAll(companyId));
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(companyId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        notificationService.markAsRead(companyId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @RequestHeader("X-Company-Id") Long companyId) {
        notificationService.markAllRead(companyId);
        return ResponseEntity.noContent().build();
    }
}
