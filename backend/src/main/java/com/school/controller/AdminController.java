package com.school.controller;

import com.school.dto.*;
import com.school.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

// ==================== Admin Controller ====================
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // Users
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer gradeLevel,
            @RequestParam(required = false) String classroom,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer graduationYear) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listUsers(role, gradeLevel, classroom, search, status, graduationYear)));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUser(id)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDto>> editUser(@PathVariable Long id, @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขผู้ใช้เรียบร้อยแล้ว", adminService.updateUser(id, request)));
    }

    @PatchMapping("/users/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleUser(@PathVariable Long id) {
        adminService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success("เปลี่ยนสถานะผู้ใช้เรียบร้อยแล้ว", null));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@PathVariable Long id) {
        adminService.resetPassword(id);
        return ResponseEntity.ok(ApiResponse.success("รีเซ็ตรหัสผ่านเรียบร้อยแล้ว (รหัสผ่านใหม่: 123456)", null));
    }

    // Import Teachers from Excel
    @PostMapping("/import/teachers")
    public ResponseEntity<ApiResponse<Object>> importTeachers(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("นำเข้าครูเรียบร้อยแล้ว", adminService.importTeachers(file)));
    }

    // Import Students with Parents from Excel
    @PostMapping("/import/students")
    public ResponseEntity<ApiResponse<Object>> importStudents(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("นำเข้านักเรียนเรียบร้อยแล้ว", adminService.importStudentsWithParents(file)));
    }

    @GetMapping("/import/students/next-sequence")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNextStudentSequence() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getNextStudentSequenceInfo()));
    }

    // Classrooms
    @PostMapping("/classrooms")
    public ResponseEntity<ApiResponse<ClassroomDto>> addClassroom(@RequestBody CreateClassroomRequest request) {
        return ResponseEntity.ok(ApiResponse.success("เพิ่มห้องเรียนเรียบร้อยแล้ว", adminService.createClassroom(request)));
    }

    @PostMapping("/classrooms/bulk")
    public ResponseEntity<ApiResponse<List<ClassroomDto>>> addBulkClassrooms(@RequestBody List<CreateClassroomRequest> requests) {
        return ResponseEntity.ok(ApiResponse.success("เพิ่มห้องเรียนทั้งหมดเรียบร้อยแล้ว", adminService.createBulkClassrooms(requests)));
    }

    @PostMapping("/classrooms/bulk-promote")
    public ResponseEntity<ApiResponse<BulkPromoteResultDto>> bulkPromoteClassrooms(@RequestBody BulkPromoteRequest request) {
        return ResponseEntity.ok(ApiResponse.success("เลื่อนชั้นห้องเรียนเรียบร้อยแล้ว", adminService.bulkPromoteClassrooms(request)));
    }

    @PostMapping("/classrooms/promote-all")
    public ResponseEntity<ApiResponse<BulkPromoteResultDto>> promoteAllClassrooms() {
        return ResponseEntity.ok(ApiResponse.success("เลื่อนชั้นเรียนทั้งโรงเรียนเรียบร้อยแล้ว", adminService.promoteAllClassrooms()));
    }

    @PostMapping("/classrooms/bulk-delete")
    public ResponseEntity<ApiResponse<Void>> bulkDeleteClassrooms(@RequestBody BulkDeleteClassroomsRequest request) {
        adminService.bulkDeleteClassrooms(request.getClassroomIds());
        return ResponseEntity.ok(ApiResponse.success("ลบห้องเรียนที่เลือกเรียบร้อยแล้ว", null));
    }

    @GetMapping("/classrooms")
    public ResponseEntity<ApiResponse<List<ClassroomDto>>> listClassrooms() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listClassrooms()));
    }

    @PutMapping("/classrooms/{id}")
    public ResponseEntity<ApiResponse<ClassroomDto>> editClassroom(@PathVariable Long id, @RequestBody CreateClassroomRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขห้องเรียนเรียบร้อยแล้ว", adminService.updateClassroom(id, request)));
    }

    @DeleteMapping("/classrooms/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClassroom(@PathVariable Long id) {
        adminService.deleteClassroom(id);
        return ResponseEntity.ok(ApiResponse.success("ลบห้องเรียนเรียบร้อยแล้ว", null));
    }

    @PostMapping("/classrooms/{classroomId}/students/{studentId}")
    public ResponseEntity<ApiResponse<Void>> addStudentToClass(@PathVariable Long classroomId, @PathVariable Long studentId) {
        adminService.addStudentToClassroom(classroomId, studentId);
        return ResponseEntity.ok(ApiResponse.success("เพิ่มนักเรียนเข้าห้องเรียนเรียบร้อยแล้ว", null));
    }

    @GetMapping("/classrooms/{classroomId}/students")
    public ResponseEntity<ApiResponse<List<StudentDto>>> listStudentsByClassroom(@PathVariable Long classroomId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listStudentsByClassroom(classroomId)));
    }

    // Subjects
    @PostMapping("/subjects")
    public ResponseEntity<ApiResponse<SubjectDto>> addSubject(@RequestBody CreateSubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("เพิ่มรายวิชาเรียบร้อยแล้ว", adminService.createSubject(request)));
    }

    @GetMapping("/subjects")
    public ResponseEntity<ApiResponse<List<SubjectDto>>> listSubjects() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listSubjects()));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<SubjectDto>> editSubject(@PathVariable Long id, @RequestBody CreateSubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขรายวิชาเรียบร้อยแล้ว", adminService.updateSubject(id, request)));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(@PathVariable Long id) {
        adminService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.success("ลบรายวิชาเรียบร้อยแล้ว", null));
    }

    @PatchMapping("/subjects/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleSubject(@PathVariable Long id) {
        adminService.toggleSubjectStatus(id);
        return ResponseEntity.ok(ApiResponse.success("เปลี่ยนสถานะรายวิชาเรียบร้อยแล้ว", null));
    }

    // TeacherSubject (มอบหมายครูสอนวิชา)
    @PostMapping("/teacher-subjects")
    public ResponseEntity<ApiResponse<TeacherSubjectDto>> addTeacherSubject(@RequestBody CreateTeacherSubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("มอบหมายครูสอนวิชาเรียบร้อยแล้ว", adminService.createTeacherSubject(request)));
    }

    @GetMapping("/teacher-subjects")
    public ResponseEntity<ApiResponse<List<TeacherSubjectDto>>> listTeacherSubjects() {
        return ResponseEntity.ok(ApiResponse.success(adminService.listTeacherSubjects()));
    }

    @PutMapping("/teacher-subjects/{id}")
    public ResponseEntity<ApiResponse<TeacherSubjectDto>> editTeacherSubject(@PathVariable Long id, @RequestBody CreateTeacherSubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลการสอนเรียบร้อยแล้ว", adminService.updateTeacherSubject(id, request)));
    }

    @DeleteMapping("/teacher-subjects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacherSubject(@PathVariable Long id) {
        adminService.deleteTeacherSubject(id);
        return ResponseEntity.ok(ApiResponse.success("ลบข้อมูลการสอนเรียบร้อยแล้ว", null));
    }

    // Schedules
    @PostMapping("/schedules")
    public ResponseEntity<ApiResponse<ScheduleDto>> addSchedule(@RequestBody CreateScheduleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("เพิ่มตารางสอนเรียบร้อยแล้ว", adminService.createSchedule(request)));
    }

    @PostMapping("/schedules/bulk")
    public ResponseEntity<ApiResponse<List<ScheduleDto>>> addBulkSchedules(@RequestBody List<CreateScheduleFullRequest> requests) {
        return ResponseEntity.ok(ApiResponse.success("เพิ่มตารางสอนทั้งหมดเรียบร้อยแล้ว", adminService.createBulkSchedules(requests)));
    }

    @GetMapping("/schedules")
    public ResponseEntity<ApiResponse<List<ScheduleDto>>> listSchedules(@RequestParam(required = false) Long teacherId) {
        return ResponseEntity.ok(ApiResponse.success(adminService.listSchedules(teacherId)));
    }

    @PutMapping("/schedules/{id}")
    public ResponseEntity<ApiResponse<ScheduleDto>> editSchedule(@PathVariable Long id, @RequestBody CreateScheduleFullRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขตารางสอนเรียบร้อยแล้ว", adminService.updateSchedule(id, request)));
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id) {
        adminService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("ลบตารางสอนเรียบร้อยแล้ว", null));
    }

    // System Report
    @GetMapping("/report/system")
    public ResponseEntity<ApiResponse<SystemReportDto>> viewSystemReport(
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String term) {
        Integer termInt = null;
        if (term != null && !term.equalsIgnoreCase("all") && !term.isBlank()) {
            try {
                termInt = Integer.parseInt(term);
            } catch (NumberFormatException ignored) {}
        }
        return ResponseEntity.ok(ApiResponse.success(adminService.getSystemReport(year, termInt)));
    }
}
