package com.school.repository;

import com.school.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByIsActiveTrue();
    boolean existsByNameAndAcademicYear(String name, String academicYear);
    boolean existsByNameAndAcademicYearAndIdNot(String name, String academicYear, Long id);
    Optional<Classroom> findFirstByNameOrderByIdDesc(String name);
    List<Classroom> findByName(String name);
    List<Classroom> findByNameOrderByAcademicYearDesc(String name);
    Optional<Classroom> findFirstByGradeLevelAndRoomNumberOrderByIdDesc(Integer gradeLevel, String roomNumber);
    List<Classroom> findByGradeLevelAndRoomNumber(Integer gradeLevel, String roomNumber);
    Optional<Classroom> findByGradeLevelAndRoomNumberAndAcademicYear(Integer gradeLevel, String roomNumber, String academicYear);
    List<Classroom> findByHomeroomTeacherUsername(String username);
    Optional<Classroom> findFirstByHomeroomTeacherUsernameOrderByIdDesc(String username);
    Optional<Classroom> findFirstByHomeroomTeacherId(Long teacherId);
}
