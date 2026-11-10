package com.school.controller;

import com.school.dto.*;
import com.school.service.AssignmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teacher")
public class TeacherController {
    private final AssignmentService assignmentService;

    public TeacherController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    // ---- Schedule ----
    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<Object>> getMySchedule(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getTeacherSchedule(auth.getName())));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<TeacherDashboardStatsDto>> getDashboardStats(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getTeacherDashboardStats(auth.getName())));
    }

    // ---- Assignments ----
    @GetMapping("/assignments")
    public ResponseEntity<ApiResponse<List<AssignmentDto>>> listAssignments(
            @RequestParam Long teacherSubjectId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.listAssignments(teacherSubjectId, auth.getName())));
    }

    @GetMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<AssignmentDto>> getAssignment(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.getAssignment(id, auth.getName())));
    }

    @PostMapping("/assignments")
    public ResponseEntity<ApiResponse<AssignmentDto>> addAssignment(
            @RequestBody CreateAssignmentRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("งานถูกสร้างเรียบร้อยแล้ว",
            assignmentService.createAssignment(request, auth.getName())));
    }

    @PutMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<AssignmentDto>> editAssignment(
            @PathVariable Long id,
            @RequestBody CreateAssignmentRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขงานเรียบร้อยแล้ว",
            assignmentService.updateAssignment(id, request, auth.getName())));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable Long id, Authentication auth) {
        assignmentService.deleteAssignment(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("ลบงานเรียบร้อยแล้ว", null));
    }

    // ---- Submission Status ----
    @GetMapping("/assignments/{id}/submissions")
    public ResponseEntity<ApiResponse<Object>> checkSubmissions(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.getSubmissions(id, auth.getName())));
    }

    @PutMapping("/submissions/{submissionId}")
    public ResponseEntity<ApiResponse<Object>> updateSubmission(
            @PathVariable Long submissionId,
            @RequestBody Object request) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.updateSubmission(submissionId, request)));
    }

    // ---- Attendance ----
    @PostMapping("/attendance")
    public ResponseEntity<ApiResponse<Void>> recordAttendance(
            @RequestBody RecordAttendanceRequest request, Authentication auth) {
        assignmentService.recordAttendance(request, auth.getName());
        return ResponseEntity.ok(ApiResponse.success("บันทึกการเข้าเรียนเรียบร้อยแล้ว", null));
    }

    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceDto>>> getAttendance(
            @RequestParam Long classroomId,
            @RequestParam String date) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.getAttendanceByDate(classroomId, date)));
    }

    // ---- Students ----
    @GetMapping("/students")
    public ResponseEntity<ApiResponse<List<StudentDto>>> listStudents(
            @RequestParam Long classroomId) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.listStudentsByClassroom(classroomId)));
    }

    @GetMapping("/homeroom")
    public ResponseEntity<ApiResponse<Object>> getHomeroom(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(assignmentService.getHomeroomDetails(auth.getName())));
    }

    // ---- Class Report ----
    @GetMapping("/report/class/{teacherSubjectId}")
    public ResponseEntity<ApiResponse<Object>> viewClassReport(
            @PathVariable Long teacherSubjectId, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(
            assignmentService.getClassReport(teacherSubjectId, auth.getName())));
    }
}
