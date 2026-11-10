package com.school.controller;

import com.school.dto.*;
import com.school.service.ParentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ==================== Parent Controller ====================
@RestController
@RequestMapping("/parent")
public class ParentController {
    private final ParentService parentService;

    public ParentController(ParentService parentService) {
        this.parentService = parentService;
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<StudentDto>>> myStudents(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(parentService.getMyStudents(auth.getName())));
    }

    @GetMapping("/students/{studentId}/info")
    public ResponseEntity<ApiResponse<StudentDto>> viewStudentInfo(@PathVariable Long studentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(parentService.getStudentInfo(studentId, auth.getName())));
    }

    @GetMapping("/students/{studentId}/assignments")
    public ResponseEntity<ApiResponse<Object>> viewAssignmentStatus(@PathVariable Long studentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(parentService.getStudentAssignments(studentId, auth.getName())));
    }

    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceDto>>> viewAttendanceRecord(
            @PathVariable Long studentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(parentService.getStudentAttendance(studentId, from, to, auth.getName())));
    }

    @GetMapping("/students/{studentId}/report")
    public ResponseEntity<ApiResponse<StudentReportDto>> viewStudentReport(@PathVariable Long studentId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(parentService.getStudentReport(studentId, auth.getName())));
    }
}
