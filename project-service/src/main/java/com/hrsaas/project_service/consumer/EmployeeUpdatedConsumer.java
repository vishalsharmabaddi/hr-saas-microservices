package com.hrsaas.project_service.consumer;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.project_service.model.ProjectMember;
import com.hrsaas.project_service.model.TaskAssignee;
import com.hrsaas.project_service.repository.ProjectMemberRepository;
import com.hrsaas.project_service.repository.TaskAssigneeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeUpdatedConsumer {

    private final ProjectMemberRepository projectMemberRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final ObjectMapper objectMapper;

    // employee-service publishes when an employee's name/email changes.
    // We refresh the denormalized copies we hold on members and task assignees.
    @KafkaListener(topics = "employee-updated", groupId = "project-service-group")
    @Transactional
    public void handleEmployeeUpdated(String message) {
        log.info("Kafka event received ← employee-updated: {}", message);
        try {
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            Long companyId  = Long.valueOf(payload.get("companyId").toString());
            Long employeeId = Long.valueOf(payload.get("employeeId").toString());
            String email    = (String) payload.get("email");
            String fullName = (String) payload.get("fullName");

            List<ProjectMember> members = projectMemberRepository.findByCompanyIdAndEmployeeId(companyId, employeeId);
            members.forEach(m -> { m.setName(fullName); m.setEmail(email); });
            projectMemberRepository.saveAll(members);

            List<TaskAssignee> assignees = taskAssigneeRepository.findByEmployeeIdAndCompanyId(employeeId, companyId);
            assignees.forEach(a -> { a.setName(fullName); a.setEmail(email); });
            taskAssigneeRepository.saveAll(assignees);

            log.info("Synced name for employee {} — {} member(s), {} assignee(s)",
                employeeId, members.size(), assignees.size());
        } catch (Exception e) {
            log.error("Failed to process employee-updated event: {}", e.getMessage());
        }
    }
}
