package com.school.repository;

import com.school.entity.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubmissionStatusRepository extends JpaRepository<SubmissionStatus, Long> {
    List<SubmissionStatus> findByAssignmentId(Long assignmentId);
    Optional<SubmissionStatus> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
    List<SubmissionStatus> findByStudentId(Long studentId);
}
