package com.school.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "classrooms")
public class Classroom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "grade_level", nullable = false)
    private Integer gradeLevel;

    @Column(name = "room_number", length = 20)
    private String roomNumber;

    @Column(name = "max_students")
    private Integer maxStudents = 30;

    @Column(name = "academic_year", nullable = false, length = 10)
    private String academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private User homeroomTeacher;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "classroom")
    private List<Student> students;

    public Classroom() {
    }

    public Classroom(Long id, String name, Integer gradeLevel, String roomNumber,
                     Integer maxStudents, String academicYear, User homeroomTeacher,
                     Boolean isActive, LocalDateTime createdAt, List<Student> students) {
        this.id = id;
        this.name = name;
        this.gradeLevel = gradeLevel;
        this.roomNumber = roomNumber;
        this.maxStudents = maxStudents != null ? maxStudents : 30;
        this.academicYear = academicYear;
        this.homeroomTeacher = homeroomTeacher;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.students = students;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getGradeLevel() { return gradeLevel; }
    public void setGradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public User getHomeroomTeacher() { return homeroomTeacher; }
    public void setHomeroomTeacher(User homeroomTeacher) { this.homeroomTeacher = homeroomTeacher; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<Student> getStudents() { return students; }
    public void setStudents(List<Student> students) { this.students = students; }

    public static ClassroomBuilder builder() {
        return new ClassroomBuilder();
    }

    public static class ClassroomBuilder {
        private Long id;
        private String name;
        private Integer gradeLevel;
        private String roomNumber;
        private Integer maxStudents;
        private String academicYear;
        private User homeroomTeacher;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private List<Student> students;

        ClassroomBuilder() {}

        public ClassroomBuilder id(Long id) { this.id = id; return this; }
        public ClassroomBuilder name(String name) { this.name = name; return this; }
        public ClassroomBuilder gradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; return this; }
        public ClassroomBuilder roomNumber(String roomNumber) { this.roomNumber = roomNumber; return this; }
        public ClassroomBuilder maxStudents(Integer maxStudents) { this.maxStudents = maxStudents; return this; }
        public ClassroomBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public ClassroomBuilder homeroomTeacher(User homeroomTeacher) { this.homeroomTeacher = homeroomTeacher; return this; }
        public ClassroomBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public ClassroomBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public ClassroomBuilder students(List<Student> students) { this.students = students; return this; }

        public Classroom build() {
            return new Classroom(id, name, gradeLevel, roomNumber, maxStudents, academicYear, homeroomTeacher, isActive, createdAt, students);
        }
    }
}
