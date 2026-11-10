package com.school.repository;

import com.school.entity.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByTeacherSubjectId(Long teacherSubjectId);
    List<Schedule> findByTeacherSubjectTeacherId(Long teacherId);

    @Query("SELECT COUNT(s) > 0 FROM Schedule s WHERE s.teacherSubject.subject.id = :subjectId")
    boolean existsBySubjectId(@Param("subjectId") Long subjectId);
}
