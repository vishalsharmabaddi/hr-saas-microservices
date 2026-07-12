package com.hrsaas.payroll_service.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.payroll_service.model.Payslip;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

// Payslip banne pe "payslip-generated" Kafka event bhejta hai.
// notification-service ise sunkar us employee ke liye notification banata hai.
@Slf4j
@Service
@RequiredArgsConstructor
public class PayslipEventProducer {

    private static final String[] MONTHS = {"January","February","March","April","May","June",
            "July","August","September","October","November","December"};

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    // recipientEmail = jis employee ki payslip hai uska email (targeted notification).
    public void sendPayslipGenerated(Payslip p, String recipientEmail) {
        // Background thread — Kafka down ho to HTTP response block na ho
        CompletableFuture.runAsync(() -> {
            try {
                String monthName = (p.getMonth() >= 1 && p.getMonth() <= 12)
                        ? MONTHS[p.getMonth() - 1] : String.valueOf(p.getMonth());

                Map<String, Object> event = new LinkedHashMap<>();
                event.put("companyId", p.getCompanyId());
                event.put("employeeId", p.getEmployeeId());
                event.put("employeeName", p.getEmployeeName());
                event.put("recipientEmail", recipientEmail);
                event.put("month", p.getMonth());
                event.put("year", p.getYear());
                event.put("netPay", p.getNetPay());
                event.put("message", "Your payslip for " + monthName + " " + p.getYear()
                        + " is ready — net pay Rs. " + p.getNetPay() + ".");

                String json = objectMapper.writeValueAsString(event);
                kafkaTemplate.send("payslip-generated", json);
                log.info("Kafka event sent → payslip-generated: {}", json);
            } catch (Exception e) {
                log.warn("Kafka not available, payslip event skipped: {}", e.getMessage());
            }
        });
    }
}
