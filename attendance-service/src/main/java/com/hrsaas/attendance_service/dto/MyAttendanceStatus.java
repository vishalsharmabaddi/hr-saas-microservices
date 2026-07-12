package com.hrsaas.attendance_service.dto;

import lombok.Data;

// "My Attendance" card ka jawab:
//  - enrolled=false  -> is login-email ka koi employee record nahi (card prompt dikhata hai)
//  - enrolled=true   -> record==null (aaj check-in nahi kiya) ya aaj ka record
@Data
public class MyAttendanceStatus {
    private boolean enrolled;
    private String employeeName;
    private AttendanceResponse record;   // aaj ka record; null = abhi tak check-in nahi kiya
}
