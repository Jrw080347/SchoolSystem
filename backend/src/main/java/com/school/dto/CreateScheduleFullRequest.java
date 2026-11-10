package com.school.dto;

public class CreateScheduleFullRequest {
    private Long teacherId;
    private Long subjectId;
    private Long classroomId;
    private String academicYear;
    private Integer semester;
    private String dayOfWeek;
    private String startTime;
    private String endTime;

    public CreateScheduleFullRequest() {
    }

    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}
