package com.school.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "students")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_code", nullable = false, unique = true, length = 20)
    private String studentCode;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(columnDefinition = "TEXT")
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "status", length = 30)
    private String status = "ACTIVE";

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    private List<ParentStudent> parentStudents;

    public Student() {
    }

    public Student(Long id, String studentCode, String firstName, String lastName,
                   LocalDate dateOfBirth, Gender gender, String address,
                   Classroom classroom, Boolean isActive, LocalDateTime createdAt,
                   LocalDateTime updatedAt, List<ParentStudent> parentStudents) {
        this.id = id;
        this.studentCode = studentCode;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.classroom = classroom;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.parentStudents = parentStudents;
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Classroom getClassroom() { return classroom; }
    public void setClassroom(Classroom classroom) { this.classroom = classroom; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }

    public String getStatus() { return status != null ? status : "ACTIVE"; }
    public void setStatus(String status) { this.status = status; }

    public Integer getGraduationYear() { return graduationYear; }
    public void setGraduationYear(Integer graduationYear) { this.graduationYear = graduationYear; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<ParentStudent> getParentStudents() { return parentStudents; }
    public void setParentStudents(List<ParentStudent> parentStudents) { this.parentStudents = parentStudents; }

    public enum Gender {
        MALE, FEMALE
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public static StudentBuilder builder() {
        return new StudentBuilder();
    }

    public static class StudentBuilder {
        private Long id;
        private String studentCode;
        private String firstName;
        private String lastName;
        private LocalDate dateOfBirth;
        private Gender gender;
        private String address;
        private Classroom classroom;
        private Boolean isActive;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<ParentStudent> parentStudents;

        StudentBuilder() {}

        public StudentBuilder id(Long id) { this.id = id; return this; }
        public StudentBuilder studentCode(String studentCode) { this.studentCode = studentCode; return this; }
        public StudentBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public StudentBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public StudentBuilder dateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; return this; }
        public StudentBuilder gender(Gender gender) { this.gender = gender; return this; }
        public StudentBuilder address(String address) { this.address = address; return this; }
        public StudentBuilder classroom(Classroom classroom) { this.classroom = classroom; return this; }
        public StudentBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public StudentBuilder status(String status) { this.status = status; return this; }
        public StudentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public StudentBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public StudentBuilder parentStudents(List<ParentStudent> parentStudents) { this.parentStudents = parentStudents; return this; }

        public Student build() {
            Student s = new Student(id, studentCode, firstName, lastName, dateOfBirth, gender, address, classroom, isActive, createdAt, updatedAt, parentStudents);
            if (status != null) s.setStatus(status);
            return s;
        }
    }
}
