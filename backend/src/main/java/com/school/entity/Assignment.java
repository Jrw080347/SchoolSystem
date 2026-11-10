package com.school.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_subject_id", nullable = false)
    private TeacherSubject teacherSubject;

    @Column(name = "assigned_date", nullable = false)
    private LocalDate assignedDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL)
    private List<SubmissionStatus> submissions;

    public Assignment() {
    }

    public Assignment(Long id, String title, String description, TeacherSubject teacherSubject,
            LocalDate assignedDate, LocalDate dueDate, BigDecimal maxScore,
            Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt,
            List<SubmissionStatus> submissions) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.teacherSubject = teacherSubject;
        this.assignedDate = assignedDate;
        this.dueDate = dueDate;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.submissions = submissions;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TeacherSubject getTeacherSubject() {
        return teacherSubject;
    }

    public void setTeacherSubject(TeacherSubject teacherSubject) {
        this.teacherSubject = teacherSubject;
    }

    public LocalDate getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(LocalDate assignedDate) {
        this.assignedDate = assignedDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<SubmissionStatus> getSubmissions() {
        return submissions;
    }

    public void setSubmissions(List<SubmissionStatus> submissions) {
        this.submissions = submissions;
    }

    public static AssignmentBuilder builder() {
        return new AssignmentBuilder();
    }

    public static class AssignmentBuilder {
        private Long id;
        private String title;
        private String description;
        private TeacherSubject teacherSubject;
        private LocalDate assignedDate;
        private LocalDate dueDate;
        private BigDecimal maxScore;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<SubmissionStatus> submissions;

        AssignmentBuilder() {
        }

        public AssignmentBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AssignmentBuilder title(String title) {
            this.title = title;
            return this;
        }

        public AssignmentBuilder description(String description) {
            this.description = description;
            return this;
        }

        public AssignmentBuilder teacherSubject(TeacherSubject teacherSubject) {
            this.teacherSubject = teacherSubject;
            return this;
        }

        public AssignmentBuilder assignedDate(LocalDate assignedDate) {
            this.assignedDate = assignedDate;
            return this;
        }

        public AssignmentBuilder dueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        public AssignmentBuilder maxScore(BigDecimal maxScore) {
            this.maxScore = maxScore;
            return this;
        }

        public AssignmentBuilder isActive(Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        public AssignmentBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AssignmentBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public AssignmentBuilder submissions(List<SubmissionStatus> submissions) {
            this.submissions = submissions;
            return this;
        }

        public Assignment build() {
            return new Assignment(id, title, description, teacherSubject, assignedDate, dueDate, maxScore, isActive,
                    createdAt, updatedAt, submissions);
        }
    }
}
