package com.school.entity;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "teacher_subject", uniqueConstraints = @UniqueConstraint(columnNames = { "teacher_id", "subject_id",
        "classroom_id", "academic_year" }))
public class TeacherSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Column(name = "academic_year", nullable = false, length = 10)
    private String academicYear;

    @Column
    private Integer semester = 1;

    @OneToMany(mappedBy = "teacherSubject", cascade = CascadeType.ALL)
    private List<Assignment> assignments;

    @OneToMany(mappedBy = "teacherSubject", cascade = CascadeType.ALL)
    private List<Schedule> schedules;

    public TeacherSubject() {
    }

    public TeacherSubject(Long id, User teacher, Subject subject, Classroom classroom,
            String academicYear, Integer semester, List<Assignment> assignments,
            List<Schedule> schedules) {
        this.id = id;
        this.teacher = teacher;
        this.subject = subject;
        this.classroom = classroom;
        this.academicYear = academicYear;
        this.semester = semester != null ? semester : 1;
        this.assignments = assignments;
        this.schedules = schedules;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getTeacher() {
        return teacher;
    }

    public void setTeacher(User teacher) {
        this.teacher = teacher;
    }

    public Subject getSubject() {
        return subject;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public Classroom getClassroom() {
        return classroom;
    }

    public void setClassroom(Classroom classroom) {
        this.classroom = classroom;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public Integer getSemester() {
        return semester;
    }

    public void setSemester(Integer semester) {
        this.semester = semester;
    }

    public List<Assignment> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments;
    }

    public List<Schedule> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedule> schedules) {
        this.schedules = schedules;
    }

    public static TeacherSubjectBuilder builder() {
        return new TeacherSubjectBuilder();
    }

    public static class TeacherSubjectBuilder {
        private Long id;
        private User teacher;
        private Subject subject;
        private Classroom classroom;
        private String academicYear;
        private Integer semester;
        private List<Assignment> assignments;
        private List<Schedule> schedules;

        TeacherSubjectBuilder() {
        }

        public TeacherSubjectBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public TeacherSubjectBuilder teacher(User teacher) {
            this.teacher = teacher;
            return this;
        }

        public TeacherSubjectBuilder subject(Subject subject) {
            this.subject = subject;
            return this;
        }

        public TeacherSubjectBuilder classroom(Classroom classroom) {
            this.classroom = classroom;
            return this;
        }

        public TeacherSubjectBuilder academicYear(String academicYear) {
            this.academicYear = academicYear;
            return this;
        }

        public TeacherSubjectBuilder semester(Integer semester) {
            this.semester = semester;
            return this;
        }

        public TeacherSubjectBuilder assignments(List<Assignment> assignments) {
            this.assignments = assignments;
            return this;
        }

        public TeacherSubjectBuilder schedules(List<Schedule> schedules) {
            this.schedules = schedules;
            return this;
        }

        public TeacherSubject build() {
            return new TeacherSubject(id, teacher, subject, classroom, academicYear, semester, assignments, schedules);
        }
    }
}
