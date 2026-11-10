package com.school.service;

import com.school.dto.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface AdminService {
    List<UserDto> listUsers(String role);
    List<UserDto> listUsers(String role, Integer gradeLevel, String classroom, String search);
    List<UserDto> listUsers(String role, Integer gradeLevel, String classroom, String search, String status);
    List<UserDto> listUsers(String role, Integer gradeLevel, String classroom, String search, String status, Integer graduationYear);
    UserDto getUser(Long id);
    UserDto updateUser(Long id, CreateUserRequest request);
    void toggleUserStatus(Long id);
    void resetPassword(Long id);
    Object importTeachers(MultipartFile file);
    Object importStudentsWithParents(MultipartFile file);
    java.util.Map<String, Object> getNextStudentSequenceInfo();
    ClassroomDto createClassroom(CreateClassroomRequest request);
    List<ClassroomDto> createBulkClassrooms(List<CreateClassroomRequest> requests);
    List<ClassroomDto> listClassrooms();
    ClassroomDto updateClassroom(Long id, CreateClassroomRequest request);
    void deleteClassroom(Long id);
    BulkPromoteResultDto bulkPromoteClassrooms(BulkPromoteRequest request);
    BulkPromoteResultDto promoteAllClassrooms();
    void bulkDeleteClassrooms(List<Long> classroomIds);
    void addStudentToClassroom(Long classroomId, Long studentId);
    List<StudentDto> listStudentsByClassroom(Long classroomId);
    SubjectDto createSubject(CreateSubjectRequest request);
    List<SubjectDto> listSubjects();
    SubjectDto updateSubject(Long id, CreateSubjectRequest request);
    void deleteSubject(Long id);
    void toggleSubjectStatus(Long id);
    // TeacherSubject (มอบหมายครูสอนวิชา)
    TeacherSubjectDto createTeacherSubject(CreateTeacherSubjectRequest request);
    List<TeacherSubjectDto> listTeacherSubjects();
    TeacherSubjectDto updateTeacherSubject(Long id, CreateTeacherSubjectRequest request);
    void deleteTeacherSubject(Long id);

    // Schedules
    ScheduleDto createSchedule(CreateScheduleRequest request);
    List<ScheduleDto> createBulkSchedules(List<CreateScheduleFullRequest> requests);
    List<ScheduleDto> listSchedules(Long teacherId);
    ScheduleDto updateSchedule(Long id, CreateScheduleFullRequest request);
    void deleteSchedule(Long id);
    SystemReportDto getSystemReport(String year, Integer term);
}
