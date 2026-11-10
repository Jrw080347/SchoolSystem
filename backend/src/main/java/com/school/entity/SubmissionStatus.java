package com.school.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "submission_status",
       uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "student_id"}))
public class SubmissionStatus {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.NOT_SUBMITTED;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "teacher_note", columnDefinition = "TEXT")
    private String teacherNote;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SubmissionStatus() {
    }

    public SubmissionStatus(Long id, Assignment assignment, Student student,
                            Status status, LocalDateTime submittedAt, BigDecimal score,
                            String teacherNote, LocalDateTime updatedAt) {
        this.id = id;
        this.assignment = assignment;
        this.student = student;
        this.status = status != null ? status : Status.NOT_SUBMITTED;
        this.submittedAt = submittedAt;
        this.score = score;
        this.teacherNote = teacherNote;
        this.updatedAt = updatedAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public BigDecimal getScore() { return score; }
    public void setScore(BigDecimal score) { this.score = score; }

    public String getTeacherNote() { return teacherNote; }
    public void setTeacherNote(String teacherNote) { this.teacherNote = teacherNote; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public enum Status {
        NOT_SUBMITTED, SUBMITTED, LATE_SUBMITTED, EXCUSED
    }

    public static SubmissionStatusBuilder builder() {
        return new SubmissionStatusBuilder();
    }

    public static class SubmissionStatusBuilder {
        private Long id;
        private Assignment assignment;
        private Student student;
        private Status status;
        private LocalDateTime submittedAt;
        private BigDecimal score;
        private String teacherNote;
        private LocalDateTime updatedAt;

        SubmissionStatusBuilder() {}

        public SubmissionStatusBuilder id(Long id) { this.id = id; return this; }
        public SubmissionStatusBuilder assignment(Assignment assignment) { this.assignment = assignment; return this; }
        public SubmissionStatusBuilder student(Student student) { this.student = student; return this; }
        public SubmissionStatusBuilder status(Status status) { this.status = status; return this; }
        public SubmissionStatusBuilder submittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; return this; }
        public SubmissionStatusBuilder score(BigDecimal score) { this.score = score; return this; }
        public SubmissionStatusBuilder teacherNote(String teacherNote) { this.teacherNote = teacherNote; return this; }
        public SubmissionStatusBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public SubmissionStatus build() {
            return new SubmissionStatus(id, assignment, student, status, submittedAt, score, teacherNote, updatedAt);
        }
    }
}
