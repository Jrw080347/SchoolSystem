package com.school.repository;

import com.school.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByClassroomIdAndDate(Long classroomId, LocalDate date);
    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate from, LocalDate to);
    List<Attendance> findByStudentId(Long studentId);
}
