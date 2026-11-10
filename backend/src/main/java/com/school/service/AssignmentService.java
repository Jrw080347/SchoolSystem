package com.school.service;

import com.school.dto.*;
import java.util.List;

public interface AssignmentService {
    Object getTeacherSchedule(String username);
    TeacherDashboardStatsDto getTeacherDashboardStats(String username);
    List<AssignmentDto> listAssignments(Long teacherSubjectId, String username);
    AssignmentDto getAssignment(Long id, String username);
    AssignmentDto createAssignment(CreateAssignmentRequest request, String username);
    AssignmentDto updateAssignment(Long id, CreateAssignmentRequest request, String username);
    void deleteAssignment(Long id, String username);
    Object getSubmissions(Long assignmentId, String username);
    Object updateSubmission(Long submissionId, Object request);
    void recordAttendance(RecordAttendanceRequest request, String username);
    List<AttendanceDto> getAttendanceByDate(Long teacherSubjectId, String date);
    List<StudentDto> listStudentsByClassroom(Long classroomId);
    Object getHomeroomDetails(String username);
    Object getClassReport(Long teacherSubjectId, String username);
}
