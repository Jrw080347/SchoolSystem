package com.school.dto;

import java.util.List;

public class StudentReportDto {
    private StudentDto student;
    private double attendanceRate;
    private int totalAttendanceDays;
    private int presentAttendanceCount;
    private int totalAssignments;
    private int submittedAssignments;
    private int pendingAssignments;
    private List<AssignmentDto> recentAssignments;
    private List<AttendanceDto> recentAttendances;

    public StudentReportDto() {
    }

    public StudentReportDto(StudentDto student, double attendanceRate, int totalAttendanceDays, int presentAttendanceCount, int totalAssignments,
                            int submittedAssignments, int pendingAssignments,
                            List<AssignmentDto> recentAssignments, List<AttendanceDto> recentAttendances) {
        this.student = student;
        this.attendanceRate = attendanceRate;
        this.totalAttendanceDays = totalAttendanceDays;
        this.presentAttendanceCount = presentAttendanceCount;
        this.totalAssignments = totalAssignments;
        this.submittedAssignments = submittedAssignments;
        this.pendingAssignments = pendingAssignments;
        this.recentAssignments = recentAssignments;
        this.recentAttendances = recentAttendances;
    }

    public StudentDto getStudent() { return student; }
    public void setStudent(StudentDto student) { this.student = student; }

    public double getAttendanceRate() { return attendanceRate; }
    public void setAttendanceRate(double attendanceRate) { this.attendanceRate = attendanceRate; }

    public int getTotalAttendanceDays() { return totalAttendanceDays; }
    public void setTotalAttendanceDays(int totalAttendanceDays) { this.totalAttendanceDays = totalAttendanceDays; }

    public int getPresentAttendanceCount() { return presentAttendanceCount; }
    public void setPresentAttendanceCount(int presentAttendanceCount) { this.presentAttendanceCount = presentAttendanceCount; }

    public int getTotalAssignments() { return totalAssignments; }
    public void setTotalAssignments(int totalAssignments) { this.totalAssignments = totalAssignments; }

    public int getSubmittedAssignments() { return submittedAssignments; }
    public void setSubmittedAssignments(int submittedAssignments) { this.submittedAssignments = submittedAssignments; }

    public int getPendingAssignments() { return pendingAssignments; }
    public void setPendingAssignments(int pendingAssignments) { this.pendingAssignments = pendingAssignments; }

    public List<AssignmentDto> getRecentAssignments() { return recentAssignments; }
    public void setRecentAssignments(List<AssignmentDto> recentAssignments) { this.recentAssignments = recentAssignments; }

    public List<AttendanceDto> getRecentAttendances() { return recentAttendances; }
    public void setRecentAttendances(List<AttendanceDto> recentAttendances) { this.recentAttendances = recentAttendances; }

    public static StudentReportDtoBuilder builder() {
        return new StudentReportDtoBuilder();
    }

    public static class StudentReportDtoBuilder {
        private StudentDto student;
        private double attendanceRate;
        private int totalAttendanceDays;
        private int presentAttendanceCount;
        private int totalAssignments;
        private int submittedAssignments;
        private int pendingAssignments;
        private List<AssignmentDto> recentAssignments;
        private List<AttendanceDto> recentAttendances;

        StudentReportDtoBuilder() {}

        public StudentReportDtoBuilder student(StudentDto student) { this.student = student; return this; }
        public StudentReportDtoBuilder attendanceRate(double attendanceRate) { this.attendanceRate = attendanceRate; return this; }
        public StudentReportDtoBuilder totalAttendanceDays(int totalAttendanceDays) { this.totalAttendanceDays = totalAttendanceDays; return this; }
        public StudentReportDtoBuilder presentAttendanceCount(int presentAttendanceCount) { this.presentAttendanceCount = presentAttendanceCount; return this; }
        public StudentReportDtoBuilder totalAssignments(int totalAssignments) { this.totalAssignments = totalAssignments; return this; }
        public StudentReportDtoBuilder submittedAssignments(int submittedAssignments) { this.submittedAssignments = submittedAssignments; return this; }
        public StudentReportDtoBuilder pendingAssignments(int pendingAssignments) { this.pendingAssignments = pendingAssignments; return this; }
        public StudentReportDtoBuilder recentAssignments(List<AssignmentDto> recentAssignments) { this.recentAssignments = recentAssignments; return this; }
        public StudentReportDtoBuilder recentAttendances(List<AttendanceDto> recentAttendances) { this.recentAttendances = recentAttendances; return this; }

        public StudentReportDto build() {
            return new StudentReportDto(student, attendanceRate, totalAttendanceDays, presentAttendanceCount, totalAssignments, submittedAssignments, pendingAssignments, recentAssignments, recentAttendances);
        }
    }
}
