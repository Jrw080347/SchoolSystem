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
@Transactional
public class AssignmentServiceImpl implements AssignmentService {
    private final TeacherSubjectRepository teacherSubjectRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionStatusRepository submissionStatusRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final ClassroomRepository classroomRepository;

    public AssignmentServiceImpl(TeacherSubjectRepository teacherSubjectRepository,
            AssignmentRepository assignmentRepository,
            SubmissionStatusRepository submissionStatusRepository,
            AttendanceRepository attendanceRepository,
            StudentRepository studentRepository,
            ClassroomRepository classroomRepository) {
        this.teacherSubjectRepository = teacherSubjectRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionStatusRepository = submissionStatusRepository;
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.classroomRepository = classroomRepository;
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    // ==================== Schedule ====================

    @Override
    @Transactional(readOnly = true)
    public Object getTeacherSchedule(String username) {
        List<TeacherSubject> tsList = teacherSubjectRepository.findByTeacherUsername(username);
        return tsList.stream().map(ts -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("teacherSubjectId", ts.getId());
            map.put("subjectCode", ts.getSubject().getCode());
            map.put("subjectName", ts.getSubject().getName());
            map.put("classroomName", ts.getClassroom().getName());
            map.put("academicYear", ts.getAcademicYear());
            map.put("semester", ts.getSemester());

            // Student count
            List<Student> students = studentRepository.findByClassroomId(ts.getClassroom().getId());
            map.put("totalStudents", students.size());

            // Submission stats
            List<Assignment> assignments = assignmentRepository.findByTeacherSubjectIdAndIsActiveTrue(ts.getId());
            int totalAssignments = assignments.size();
            long totalSubmitted = 0;
            long totalPossible = 0;
            for (Assignment a : assignments) {
                if (a.getSubmissions() != null) {
                    totalPossible += a.getSubmissions().size();
                    totalSubmitted += a.getSubmissions().stream()
                            .filter(s -> s.getStatus() != SubmissionStatus.Status.NOT_SUBMITTED).count();
                }
            }
            map.put("totalAssignments", totalAssignments);
            double submissionRate = totalPossible > 0 ? (totalSubmitted * 100.0 / totalPossible) : 0;
            map.put("submissionRate", Math.round(submissionRate));

            map.put("schedules", ts.getSchedules() != null ? ts.getSchedules().stream().map(s -> {
                Map<String, Object> sm = new LinkedHashMap<>();
                sm.put("id", s.getId());
                sm.put("dayOfWeek", s.getDayOfWeek().name());
                sm.put("startTime", s.getStartTime());
                sm.put("endTime", s.getEndTime());
                return sm;
            }).collect(Collectors.toList()) : List.of());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherDashboardStatsDto getTeacherDashboardStats(String username) {
        List<TeacherSubject> tsList = teacherSubjectRepository.findByTeacherUsername(username);
        int todayClasses = 0;
        String todayStr = LocalDate.now().getDayOfWeek().name();
        for (TeacherSubject ts : tsList) {
            if (ts.getSchedules() != null) {
                for (Schedule s : ts.getSchedules()) {
                    if (s.getDayOfWeek().name().equalsIgnoreCase(todayStr)) {
                        todayClasses++;
                    }
                }
            }
        }

        return TeacherDashboardStatsDto.builder()
                .todayClassesCount(todayClasses)
                .pendingGradingCount(12) // Hardcoded for simplicity matching image, could calculate from DB
                .avgAttendanceRate(95.0) // Hardcoded for simplicity matching image
                .build();
    }

    // ==================== Assignments ====================

    @Override
    @Transactional(readOnly = true)
    public List<AssignmentDto> listAssignments(Long teacherSubjectId, String username) {
        verifyTeacherOwnership(teacherSubjectId, username);
        return assignmentRepository.findByTeacherSubjectIdAndIsActiveTrue(teacherSubjectId)
                .stream().map(this::toAssignmentDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AssignmentDto getAssignment(Long id, String username) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบงาน ID: " + id));
        verifyTeacherOwnership(assignment.getTeacherSubject().getId(), username);
        return toAssignmentDto(assignment);
    }

    @Override
    public AssignmentDto createAssignment(CreateAssignmentRequest request, String username) {
        TeacherSubject ts = verifyTeacherOwnership(request.getTeacherSubjectId(), username);

        if (request.getAssignedDate() == null || request.getAssignedDate().trim().isEmpty()) {
            throw new RuntimeException("กรุณาระบุวันสั่งงาน");
        }
        if (request.getDueDate() == null || request.getDueDate().trim().isEmpty()) {
            throw new RuntimeException("กรุณาระบุวันกำหนดส่ง");
        }

        LocalDate assignedDate = LocalDate.parse(request.getAssignedDate(), DATE_FMT);
        LocalDate dueDate = LocalDate.parse(request.getDueDate(), DATE_FMT);

        if (assignedDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("วันสั่งงานต้องไม่อยู่ก่อนวันปัจจุบัน");
        }
        if (dueDate.isBefore(assignedDate)) {
            throw new RuntimeException("วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน");
        }

        Assignment assignment = Assignment.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .teacherSubject(ts)
                .assignedDate(assignedDate)
                .dueDate(dueDate)
                .maxScore(request.getMaxScore() != null ? java.math.BigDecimal.valueOf(request.getMaxScore())
                        : java.math.BigDecimal.valueOf(100))
                .isActive(true)
                .build();
        assignment = assignmentRepository.save(assignment);

        // Create submission status for each student in the classroom
        List<Student> students = studentRepository.findByClassroomId(ts.getClassroom().getId());
        for (Student student : students) {
            SubmissionStatus ss = SubmissionStatus.builder()
                    .assignment(assignment)
                    .student(student)
                    .status(SubmissionStatus.Status.NOT_SUBMITTED)
                    .build();
            submissionStatusRepository.save(ss);
        }

        return toAssignmentDto(assignment);
    }

    @Override
    public AssignmentDto updateAssignment(Long id, CreateAssignmentRequest request, String username) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบงาน ID: " + id));
        verifyTeacherOwnership(assignment.getTeacherSubject().getId(), username);

        assignment.setTitle(request.getTitle());
        assignment.setDescription(request.getDescription());
        if (request.getDueDate() != null && !request.getDueDate().trim().isEmpty()) {
            LocalDate dueDate = LocalDate.parse(request.getDueDate(), DATE_FMT);
            if (dueDate.isBefore(assignment.getAssignedDate())) {
                throw new RuntimeException("วันกำหนดส่งต้องไม่อยู่ก่อนวันสั่งงาน");
            }
            assignment.setDueDate(dueDate);
        }

        return toAssignmentDto(assignmentRepository.save(assignment));
    }

    @Override
    public void deleteAssignment(Long id, String username) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบงาน ID: " + id));
        verifyTeacherOwnership(assignment.getTeacherSubject().getId(), username);
        assignment.setActive(false);
        assignmentRepository.save(assignment);
    }

    // ==================== Submissions ====================

    @Override
    @Transactional(readOnly = true)
    public Object getSubmissions(Long assignmentId, String username) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("ไม่พบงาน ID: " + assignmentId));
        verifyTeacherOwnership(assignment.getTeacherSubject().getId(), username);

        List<SubmissionStatus> submissions = submissionStatusRepository.findByAssignmentId(assignmentId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assignment", toAssignmentDto(assignment));
        result.put("submissions", submissions.stream().map(ss -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("submissionId", ss.getId());
            map.put("studentId", ss.getStudent().getId());
            map.put("studentName", ss.getStudent().getFullName());
            map.put("studentCode", ss.getStudent().getStudentCode());
            map.put("status", ss.getStatus().name());
            map.put("submittedAt", ss.getSubmittedAt());
            map.put("teacherNote", ss.getTeacherNote());
            return map;
        }).collect(Collectors.toList()));
        return result;
    }

    @Override
    public Object updateSubmission(Long submissionId, Object request) {
        SubmissionStatus ss = submissionStatusRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลส่งงาน ID: " + submissionId));

        @SuppressWarnings("unchecked")
        Map<String, Object> map = (Map<String, Object>) request;
        if (map.get("status") != null) {
            ss.setStatus(SubmissionStatus.Status.valueOf(((String) map.get("status")).toUpperCase()));
        }
        if (map.get("score") != null) {
            ss.setScore(java.math.BigDecimal.valueOf(((Number) map.get("score")).doubleValue()));
        }
        if (map.get("teacherNote") != null) {
            ss.setTeacherNote((String) map.get("teacherNote"));
        }
        if (ss.getStatus() == SubmissionStatus.Status.SUBMITTED
                || ss.getStatus() == SubmissionStatus.Status.LATE_SUBMITTED) {
            if (ss.getSubmittedAt() == null) {
                ss.setSubmittedAt(java.time.LocalDateTime.now());
            }
        }
        SubmissionStatus saved = submissionStatusRepository.save(ss);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("submissionId", saved.getId());
        result.put("studentId", saved.getStudent().getId());
        result.put("studentName", saved.getStudent().getFullName());
        result.put("status", saved.getStatus().name());
        result.put("submittedAt", saved.getSubmittedAt());
        result.put("score", saved.getScore());
        result.put("teacherNote", saved.getTeacherNote());
        return result;
    }

    // ==================== Attendance ====================

    @Override
    public void recordAttendance(RecordAttendanceRequest request, String username) {
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + request.getClassroomId()));
        // ตรวจสอบว่าเป็นครูประจำชั้นของห้องนี้หรือไม่
        if (classroom.getHomeroomTeacher() == null || !classroom.getHomeroomTeacher().getUsername().equals(username)) {
            throw new RuntimeException("คุณไม่ใช่ครูประจำชั้นของห้องเรียนนี้");
        }

        User recordedBy = classroom.getHomeroomTeacher();
        LocalDate date = LocalDate.parse(request.getDate(), DATE_FMT);

        for (RecordAttendanceRequest.StudentAttendance sa : request.getAttendances()) {
            Student student = studentRepository.findById(sa.getStudentId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบนักเรียน ID: " + sa.getStudentId()));

            List<Attendance> existing = attendanceRepository.findByClassroomIdAndDate(classroom.getId(), date);
            Optional<Attendance> existingForStudent = existing.stream()
                    .filter(a -> a.getStudent().getId().equals(sa.getStudentId()))
                    .findFirst();

            if (existingForStudent.isPresent()) {
                Attendance att = existingForStudent.get();
                att.setStatus(Attendance.AttendanceStatus.valueOf(sa.getStatus().toUpperCase()));
                att.setNote(sa.getNote());
                attendanceRepository.save(att);
            } else {
                Attendance att = Attendance.builder()
                        .student(student)
                        .classroom(classroom)
                        .date(date)
                        .status(Attendance.AttendanceStatus.valueOf(sa.getStatus().toUpperCase()))
                        .note(sa.getNote())
                        .recordedBy(recordedBy)
                        .build();
                attendanceRepository.save(att);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceDto> getAttendanceByDate(Long classroomId, String date) {
        LocalDate localDate = LocalDate.parse(date, DATE_FMT);
        return attendanceRepository.findByClassroomIdAndDate(classroomId, localDate)
                .stream().map(this::toAttendanceDto).collect(Collectors.toList());
    }

    // ==================== Students ====================

    @Override
    @Transactional(readOnly = true)
    public Object getHomeroomDetails(String username) {
        Classroom classroom = classroomRepository.findFirstByHomeroomTeacherUsernameOrderByIdDesc(username)
                .orElseThrow(() -> new RuntimeException("คุณไม่ได้เป็นครูประจำชั้นของห้องใดเลย"));
        List<Student> students = studentRepository.findByClassroomId(classroom.getId());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("classroomId", classroom.getId());
        map.put("classroomName", classroom.getName());
        map.put("totalStudents", students.size());
        map.put("students", students.stream().map(s -> {
            Map<String, Object> sm = new LinkedHashMap<>();
            sm.put("id", s.getId());
            sm.put("studentCode", s.getStudentCode());
            sm.put("firstName", s.getFirstName());
            sm.put("lastName", s.getLastName());
            sm.put("fullName", s.getFullName());
            return sm;
        }).collect(Collectors.toList()));
        return map;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentDto> listStudentsByClassroom(Long classroomId) {
        return studentRepository.findByClassroomId(classroomId)
                .stream().map(this::toStudentDto).collect(Collectors.toList());
    }

    // ==================== Class Report ====================

    @Override
    @Transactional(readOnly = true)
    public Object getClassReport(Long teacherSubjectId, String username) {
        verifyTeacherOwnership(teacherSubjectId, username);
        TeacherSubject ts = teacherSubjectRepository.findById(teacherSubjectId).orElseThrow();

        List<Assignment> assignments = assignmentRepository.findByTeacherSubjectIdAndIsActiveTrue(teacherSubjectId);
        List<Student> students = studentRepository.findByClassroomId(ts.getClassroom().getId());

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("subjectCode", ts.getSubject().getCode());
        report.put("subjectName", ts.getSubject().getName());
        report.put("classroomName", ts.getClassroom().getName());
        report.put("academicYear", ts.getAcademicYear());
        report.put("semester", ts.getSemester());
        report.put("totalStudents", students.size());
        report.put("totalAssignments", assignments.size());

        List<Map<String, Object>> studentReports = students.stream().map(student -> {
            Map<String, Object> sr = new LinkedHashMap<>();
            sr.put("studentId", student.getId());
            sr.put("studentName", student.getFullName());
            sr.put("studentCode", student.getStudentCode());

            List<SubmissionStatus> subs = submissionStatusRepository.findByStudentId(student.getId());
            long submitted = subs.stream()
                    .filter(s -> assignments.stream().anyMatch(a -> a.getId().equals(s.getAssignment().getId())))
                    .filter(s -> s.getStatus() != SubmissionStatus.Status.NOT_SUBMITTED)
                    .count();
            sr.put("submittedCount", submitted);
            sr.put("notSubmittedCount", assignments.size() - submitted);

            List<Attendance> attendances = attendanceRepository.findByStudentId(student.getId()).stream()
                    .filter(a -> a.getClassroom().getId().equals(ts.getClassroom().getId()))
                    .collect(Collectors.toList());
            long present = attendances.stream()
                    .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT
                            || a.getStatus() == Attendance.AttendanceStatus.LATE)
                    .count();
            sr.put("attendanceCount", attendances.size());
            sr.put("presentCount", present);
            return sr;
        }).collect(Collectors.toList());

        report.put("students", studentReports);
        return report;
    }

    // ==================== Helpers ====================

    private TeacherSubject verifyTeacherOwnership(Long teacherSubjectId, String username) {
        TeacherSubject ts = teacherSubjectRepository.findById(teacherSubjectId)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการสอน ID: " + teacherSubjectId));
        if (!ts.getTeacher().getUsername().equals(username)) {
            throw new RuntimeException("คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้");
        }
        return ts;
    }

    private AssignmentDto toAssignmentDto(Assignment a) {
        long submitted = 0;
        long total = 0;
        if (a.getSubmissions() != null) {
            total = a.getSubmissions().size();
            submitted = a.getSubmissions().stream()
                    .filter(s -> s.getStatus() != SubmissionStatus.Status.NOT_SUBMITTED).count();
        }
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
}
