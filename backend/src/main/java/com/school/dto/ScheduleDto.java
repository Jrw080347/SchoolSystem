package com.school.dto;

public class ScheduleDto {
    private Long id;
    private Long teacherSubjectId;
    private String teacherName;
    private String subjectName;
    private String subjectCode;
    private String classroomName;
    private String dayOfWeek;
    private String dayOfWeekTh;
    private String startTime;
    private String endTime;
    private String academicYear;
    private Integer semester;

    public ScheduleDto() {
    }

    public ScheduleDto(Long id, Long teacherSubjectId, String teacherName, String subjectName,
                       String subjectCode, String classroomName, String dayOfWeek,
                       String dayOfWeekTh, String startTime, String endTime,
                       String academicYear, Integer semester) {
        this.id = id;
        this.teacherSubjectId = teacherSubjectId;
        this.teacherName = teacherName;
        this.subjectName = subjectName;
        this.subjectCode = subjectCode;
        this.classroomName = classroomName;
        this.dayOfWeek = dayOfWeek;
        this.dayOfWeekTh = dayOfWeekTh;
        this.startTime = startTime;
        this.endTime = endTime;
        this.academicYear = academicYear;
        this.semester = semester;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTeacherSubjectId() { return teacherSubjectId; }
    public void setTeacherSubjectId(Long teacherSubjectId) { this.teacherSubjectId = teacherSubjectId; }

    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getDayOfWeekTh() { return dayOfWeekTh; }
    public void setDayOfWeekTh(String dayOfWeekTh) { this.dayOfWeekTh = dayOfWeekTh; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public static ScheduleDtoBuilder builder() {
        return new ScheduleDtoBuilder();
    }

    public static class ScheduleDtoBuilder {
        private Long id;
        private Long teacherSubjectId;
        private String teacherName;
        private String subjectName;
        private String subjectCode;
        private String classroomName;
        private String dayOfWeek;
        private String dayOfWeekTh;
        private String startTime;
        private String endTime;
        private String academicYear;
        private Integer semester;

        ScheduleDtoBuilder() {}

        public ScheduleDtoBuilder id(Long id) { this.id = id; return this; }
        public ScheduleDtoBuilder teacherSubjectId(Long teacherSubjectId) { this.teacherSubjectId = teacherSubjectId; return this; }
        public ScheduleDtoBuilder teacherName(String teacherName) { this.teacherName = teacherName; return this; }
        public ScheduleDtoBuilder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public ScheduleDtoBuilder subjectCode(String subjectCode) { this.subjectCode = subjectCode; return this; }
        public ScheduleDtoBuilder classroomName(String classroomName) { this.classroomName = classroomName; return this; }
        public ScheduleDtoBuilder dayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; return this; }
        public ScheduleDtoBuilder dayOfWeekTh(String dayOfWeekTh) { this.dayOfWeekTh = dayOfWeekTh; return this; }
        public ScheduleDtoBuilder startTime(String startTime) { this.startTime = startTime; return this; }
        public ScheduleDtoBuilder endTime(String endTime) { this.endTime = endTime; return this; }
        public ScheduleDtoBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public ScheduleDtoBuilder semester(Integer semester) { this.semester = semester; return this; }

        public ScheduleDto build() {
            return new ScheduleDto(id, teacherSubjectId, teacherName, subjectName, subjectCode, classroomName, dayOfWeek, dayOfWeekTh, startTime, endTime, academicYear, semester);
        }
    }
}
