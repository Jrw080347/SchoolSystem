package com.school.repository;

import com.school.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentCode(String studentCode);
    boolean existsByStudentCode(String studentCode);
    boolean existsByFirstNameAndLastName(String firstName, String lastName);
    List<Student> findByClassroomId(Long classroomId);

    @Query("SELECT s.studentCode FROM Student s WHERE s.studentCode LIKE CONCAT(:prefix, '%')")
    List<String> findStudentCodesStartingWith(@Param("prefix") String prefix);
}
