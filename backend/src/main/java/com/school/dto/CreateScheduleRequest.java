package com.school.dto;

public class CreateScheduleRequest {
    private Long teacherSubjectId;
    private String dayOfWeek;
    private String startTime;
    private String endTime;

    public CreateScheduleRequest() {
    }

    public Long getTeacherSubjectId() { return teacherSubjectId; }
    public void setTeacherSubjectId(Long teacherSubjectId) { this.teacherSubjectId = teacherSubjectId; }

    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
}
