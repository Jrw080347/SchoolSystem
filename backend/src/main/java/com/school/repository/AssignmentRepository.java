package com.school.repository;

import com.school.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByTeacherSubjectId(Long teacherSubjectId);
    List<Assignment> findByTeacherSubjectIdAndIsActiveTrue(Long teacherSubjectId);
}
