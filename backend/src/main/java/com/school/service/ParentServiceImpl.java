package com.school.service;

import com.school.dto.*;
import com.school.entity.*;
import com.school.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ParentServiceImpl implements ParentService {
    private final ParentStudentRepository parentStudentRepository;
    private final StudentRepository studentRepository;
    private final SubmissionStatusRepository submissionStatusRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    public ParentServiceImpl(ParentStudentRepository parentStudentRepository,
            StudentRepository studentRepository,
            SubmissionStatusRepository submissionStatusRepository,
            AttendanceRepository attendanceRepository,
            UserRepository userRepository) {
        this.parentStudentRepository = parentStudentRepository;
        this.studentRepository = studentRepository;
        this.submissionStatusRepository = submissionStatusRepository;
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public List<StudentDto> getMyStudents(String username) {
        List<ParentStudent> links = parentStudentRepository.findByParentUsername(username);
        return links.stream()
                .map(ps -> toStudentDto(ps.getStudent()))
                .collect(Collectors.toList());
    }

    @Override
    public StudentDto getStudentInfo(Long studentId, String username) {
        verifyParentAccess(studentId, username);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("ไม่พบนักเรียน ID: " + studentId));
        return toStudentDto(student);
    }

    @Override
    public Object getStudentAssignments(Long studentId, String username) {
        verifyParentAccess(studentId, username);
        List<SubmissionStatus> submissions = submissionStatusRepository.findByStudentId(studentId);
        return submissions.stream().map(ss -> {
            Assignment a = ss.getAssignment();
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("assignmentId", a.getId());
            map.put("title", a.getTitle());
            map.put("description", a.getDescription());
            map.put("subjectName", a.getTeacherSubject().getSubject().getName());
            map.put("assignedDate", a.getAssignedDate().toString());
            map.put("dueDate", a.getDueDate().toString());
            map.put("status", ss.getStatus().name());
            map.put("submittedAt", ss.getSubmittedAt());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public List<AttendanceDto> getStudentAttendance(Long studentId, String from, String to, String username) {
        verifyParentAccess(studentId, username);
        List<Attendance> attendances;
        if (from != null && to != null) {
            LocalDate fromDate = LocalDate.parse(from, DATE_FMT);
            LocalDate toDate = LocalDate.parse(to, DATE_FMT);
            attendances = attendanceRepository.findByStudentIdAndDateBetween(studentId, fromDate, toDate);
        } else {
            attendances = attendanceRepository.findByStudentId(studentId);
        }
        return attendances.stream().map(this::toAttendanceDto).collect(Collectors.toList());
    }

    @Override
    public StudentReportDto getStudentReport(Long studentId, String username) {
        verifyParentAccess(studentId, username);
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("ไม่พบนักเรียน ID: " + studentId));

        List<SubmissionStatus> allSubmissions = submissionStatusRepository.findByStudentId(studentId);
        int totalAssignments = allSubmissions.size();
        int submitted = (int) allSubmissions.stream()
                .filter(s -> s.getStatus() != SubmissionStatus.Status.NOT_SUBMITTED).count();
        int pending = totalAssignments - submitted;

        List<Attendance> allAttendance = attendanceRepository.findByStudentId(studentId);
        long present = allAttendance.stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT
                        || a.getStatus() == Attendance.AttendanceStatus.LATE)
                .count();
        int totalAttendanceDays = allAttendance.size();
        double attendanceRate = totalAttendanceDays > 0 ? ((double) present / totalAttendanceDays) * 100.0 : 0.0;

        // Recent 5 assignments
        List<AssignmentDto> recentAssignments = allSubmissions.stream()
                .sorted(Comparator.comparing((SubmissionStatus s) -> s.getAssignment().getDueDate()).reversed())
                .limit(5)
                .map(ss -> {
                    AssignmentDto dto = toAssignmentDto(ss.getAssignment());
                    dto.setStatus(ss.getStatus().name());
                    return dto;
                })
                .collect(Collectors.toList());

        // Recent 10 attendances
        List<AttendanceDto> recentAttendances = allAttendance.stream()
                .sorted(Comparator.comparing(Attendance::getDate).reversed())
                .limit(10)
                .map(this::toAttendanceDto)
                .collect(Collectors.toList());

        return StudentReportDto.builder()
                .student(toStudentDto(student))
                .attendanceRate(Math.round(attendanceRate * 100.0) / 100.0)
                .totalAttendanceDays(totalAttendanceDays)
                .presentAttendanceCount((int) present)
                .totalAssignments(totalAssignments)
                .submittedAssignments(submitted)
                .pendingAssignments(pending)
                .recentAssignments(recentAssignments)
                .recentAttendances(recentAttendances)
                .build();
    }

    // ==================== Helpers ====================

    private void verifyParentAccess(Long studentId, String username) {
        User parent = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้: " + username));
        boolean hasAccess = parentStudentRepository.existsByParentIdAndStudentId(parent.getId(), studentId);
        if (!hasAccess) {
            throw new RuntimeException("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนักเรียนนี้");
        }
    }

    private StudentDto toStudentDto(Student s) {
        return StudentDto.builder()
                .id(s.getId())
                .studentCode(s.getStudentCode())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .dateOfBirth(s.getDateOfBirth() != null ? s.getDateOfBirth().toString() : null)
                .gender(s.getGender().name())
                .address(s.getAddress())
                .classroomId(s.getClassroom() != null ? s.getClassroom().getId() : null)
                .classroomName(s.getClassroom() != null ? s.getClassroom().getName() : null)
                .isActive(s.isActive())
                .build();
    }

    private AttendanceDto toAttendanceDto(Attendance a) {
        return AttendanceDto.builder()
                .id(a.getId())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getFullName())
                .date(a.getDate().toString())
                .status(a.getStatus().name())
                .note(a.getNote())
                .build();
    }

    private AssignmentDto toAssignmentDto(Assignment a) {
        long total = a.getSubmissions() != null ? a.getSubmissions().size() : 0;
        long submitted = a.getSubmissions() != null
                ? a.getSubmissions().stream().filter(s -> s.getStatus() != SubmissionStatus.Status.NOT_SUBMITTED)
                        .count()
                : 0;
        return AssignmentDto.builder()
                .id(a.getId())
                .title(a.getTitle())
                .description(a.getDescription())
                .assignedDate(a.getAssignedDate().toString())
                .dueDate(a.getDueDate().toString())
                .subjectName(a.getTeacherSubject().getSubject().getName())
                .classroomName(a.getTeacherSubject().getClassroom().getName())
                .totalStudents((int) total)
                .submittedCount((int) submitted)
                .notSubmittedCount((int) (total - submitted))
                .build();
    }
}
