package com.school.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "schedules")
public class Schedule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_subject_id", nullable = false)
    private TeacherSubject teacherSubject;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private String startTime;

    @Column(name = "end_time", nullable = false)
    private String endTime;

    @Column(name = "academic_year", nullable = false, length = 10)
    private String academicYear;

    @Column
    private Integer semester = 1;

    public Schedule() {
    }

    public Schedule(Long id, TeacherSubject teacherSubject, DayOfWeek dayOfWeek,
                    String startTime, String endTime, String academicYear, Integer semester) {
        this.id = id;
        this.teacherSubject = teacherSubject;
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.academicYear = academicYear;
        this.semester = semester != null ? semester : 1;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TeacherSubject getTeacherSubject() { return teacherSubject; }
    public void setTeacherSubject(TeacherSubject teacherSubject) { this.teacherSubject = teacherSubject; }

    public DayOfWeek getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(DayOfWeek dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public enum DayOfWeek {
        MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY
    }

    public static ScheduleBuilder builder() {
        return new ScheduleBuilder();
    }

    public static class ScheduleBuilder {
        private Long id;
        private TeacherSubject teacherSubject;
        private DayOfWeek dayOfWeek;
        private String startTime;
        private String endTime;
        private String academicYear;
        private Integer semester;

        ScheduleBuilder() {}

        public ScheduleBuilder id(Long id) { this.id = id; return this; }
        public ScheduleBuilder teacherSubject(TeacherSubject teacherSubject) { this.teacherSubject = teacherSubject; return this; }
        public ScheduleBuilder dayOfWeek(DayOfWeek dayOfWeek) { this.dayOfWeek = dayOfWeek; return this; }
        public ScheduleBuilder startTime(String startTime) { this.startTime = startTime; return this; }
        public ScheduleBuilder endTime(String endTime) { this.endTime = endTime; return this; }
        public ScheduleBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public ScheduleBuilder semester(Integer semester) { this.semester = semester; return this; }

        public Schedule build() {
            return new Schedule(id, teacherSubject, dayOfWeek, startTime, endTime, academicYear, semester);
        }
    }
}
