package com.school.service;

import com.school.dto.*;
import java.util.List;

public interface ParentService {
    List<StudentDto> getMyStudents(String username);
    StudentDto getStudentInfo(Long studentId, String username);
    Object getStudentAssignments(Long studentId, String username);
    List<AttendanceDto> getStudentAttendance(Long studentId, String from, String to, String username);
    StudentReportDto getStudentReport(Long studentId, String username);
}
