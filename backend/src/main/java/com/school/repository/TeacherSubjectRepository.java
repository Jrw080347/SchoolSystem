package com.school.repository;

import com.school.entity.TeacherSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeacherSubjectRepository extends JpaRepository<TeacherSubject, Long> {
    List<TeacherSubject> findByTeacherId(Long teacherId);
    List<TeacherSubject> findByClassroomId(Long classroomId);
    List<TeacherSubject> findByTeacherUsername(String username);
    boolean existsBySubjectId(Long subjectId);
    Optional<TeacherSubject> findByTeacherIdAndSubjectIdAndClassroomIdAndAcademicYear(
            Long teacherId, Long subjectId, Long classroomId, String academicYear);
    Optional<TeacherSubject> findFirstByTeacherIdAndSubjectIdAndClassroomIdAndAcademicYearOrderByIdDesc(
            Long teacherId, Long subjectId, Long classroomId, String academicYear);
}
