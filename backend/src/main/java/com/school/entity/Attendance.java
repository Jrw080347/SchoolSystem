package com.school.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "classroom_id", "date"}))
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by", nullable = false)
    private User recordedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Attendance() {
    }

    public Attendance(Long id, Student student, Classroom classroom, LocalDate date,
                      AttendanceStatus status, String note, User recordedBy,
                      LocalDateTime createdAt) {
        this.id = id;
        this.student = student;
        this.classroom = classroom;
        this.date = date;
        this.status = status != null ? status : AttendanceStatus.PRESENT;
        this.note = note;
        this.recordedBy = recordedBy;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Classroom getClassroom() { return classroom; }
    public void setClassroom(Classroom classroom) { this.classroom = classroom; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public User getRecordedBy() { return recordedBy; }
    public void setRecordedBy(User recordedBy) { this.recordedBy = recordedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public enum AttendanceStatus {
        PRESENT, ABSENT, LATE, EXCUSED
    }

    public static AttendanceBuilder builder() {
        return new AttendanceBuilder();
    }

    public static class AttendanceBuilder {
        private Long id;
        private Student student;
        private Classroom classroom;
        private LocalDate date;
        private AttendanceStatus status;
        private String note;
        private User recordedBy;
        private LocalDateTime createdAt;

        AttendanceBuilder() {}

        public AttendanceBuilder id(Long id) { this.id = id; return this; }
        public AttendanceBuilder student(Student student) { this.student = student; return this; }
        public AttendanceBuilder classroom(Classroom classroom) { this.classroom = classroom; return this; }
        public AttendanceBuilder date(LocalDate date) { this.date = date; return this; }
        public AttendanceBuilder status(AttendanceStatus status) { this.status = status; return this; }
        public AttendanceBuilder note(String note) { this.note = note; return this; }
        public AttendanceBuilder recordedBy(User recordedBy) { this.recordedBy = recordedBy; return this; }
        public AttendanceBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Attendance build() {
            return new Attendance(id, student, classroom, date, status, note, recordedBy, createdAt);
        }
    }
}
