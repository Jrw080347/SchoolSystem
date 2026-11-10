package com.school.repository;

import com.school.entity.ParentStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ParentStudentRepository extends JpaRepository<ParentStudent, Long> {
    List<ParentStudent> findByParentId(Long parentId);
    List<ParentStudent> findByStudentId(Long studentId);
    List<ParentStudent> findByParentUsername(String username);
    boolean existsByParentIdAndStudentId(Long parentId, Long studentId);
}
