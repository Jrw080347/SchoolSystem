package com.school.dto;

import java.util.List;

public class SystemReportDto {
    private int totalStudents;
    private int totalTeachers;
    private int totalParents;
    private int totalClassrooms;
    private int totalSubjects;
    private int totalAssignments;
    private int totalSubmitted;
    private int pendingGrading;
    private double avgSubmissionRate;
    private double avgAttendanceRate;
    private List<RecentActivityDto> recentActivities;
    private List<SubjectAchievementDto> subjectAchievements;
    private List<String> availableYears;

    public SystemReportDto() {
    }

    public SystemReportDto(int totalStudents, int totalTeachers, int totalParents,
                           int totalClassrooms, int totalSubjects, int totalAssignments,
                           int totalSubmitted, int pendingGrading, double avgSubmissionRate,
                           double avgAttendanceRate, List<RecentActivityDto> recentActivities,
                           List<SubjectAchievementDto> subjectAchievements, List<String> availableYears) {
        this.totalStudents = totalStudents;
        this.totalTeachers = totalTeachers;
        this.totalParents = totalParents;
        this.totalClassrooms = totalClassrooms;
        this.totalSubjects = totalSubjects;
        this.totalAssignments = totalAssignments;
        this.totalSubmitted = totalSubmitted;
        this.pendingGrading = pendingGrading;
        this.avgSubmissionRate = avgSubmissionRate;
        this.avgAttendanceRate = avgAttendanceRate;
        this.recentActivities = recentActivities;
        this.subjectAchievements = subjectAchievements;
        this.availableYears = availableYears;
    }

    public int getTotalStudents() { return totalStudents; }
    public void setTotalStudents(int totalStudents) { this.totalStudents = totalStudents; }

    public int getTotalTeachers() { return totalTeachers; }
    public void setTotalTeachers(int totalTeachers) { this.totalTeachers = totalTeachers; }

    public int getTotalParents() { return totalParents; }
    public void setTotalParents(int totalParents) { this.totalParents = totalParents; }

    public int getTotalClassrooms() { return totalClassrooms; }
    public void setTotalClassrooms(int totalClassrooms) { this.totalClassrooms = totalClassrooms; }

    public int getTotalSubjects() { return totalSubjects; }
    public void setTotalSubjects(int totalSubjects) { this.totalSubjects = totalSubjects; }

    public int getTotalAssignments() { return totalAssignments; }
    public void setTotalAssignments(int totalAssignments) { this.totalAssignments = totalAssignments; }

    public int getTotalSubmitted() { return totalSubmitted; }
    public void setTotalSubmitted(int totalSubmitted) { this.totalSubmitted = totalSubmitted; }

    public int getPendingGrading() { return pendingGrading; }
    public void setPendingGrading(int pendingGrading) { this.pendingGrading = pendingGrading; }

    public double getAvgSubmissionRate() { return avgSubmissionRate; }
    public void setAvgSubmissionRate(double avgSubmissionRate) { this.avgSubmissionRate = avgSubmissionRate; }

    public double getAvgAttendanceRate() { return avgAttendanceRate; }
    public void setAvgAttendanceRate(double avgAttendanceRate) { this.avgAttendanceRate = avgAttendanceRate; }

    public List<RecentActivityDto> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<RecentActivityDto> recentActivities) { this.recentActivities = recentActivities; }

    public List<SubjectAchievementDto> getSubjectAchievements() { return subjectAchievements; }
    public void setSubjectAchievements(List<SubjectAchievementDto> subjectAchievements) { this.subjectAchievements = subjectAchievements; }

    public List<String> getAvailableYears() { return availableYears; }
    public void setAvailableYears(List<String> availableYears) { this.availableYears = availableYears; }

    public static SystemReportDtoBuilder builder() {
        return new SystemReportDtoBuilder();
    }

    public static class SystemReportDtoBuilder {
        private int totalStudents;
        private int totalTeachers;
        private int totalParents;
        private int totalClassrooms;
        private int totalSubjects;
        private int totalAssignments;
        private int totalSubmitted;
        private int pendingGrading;
        private double avgSubmissionRate;
        private double avgAttendanceRate;
        private List<RecentActivityDto> recentActivities;
        private List<SubjectAchievementDto> subjectAchievements;
        private List<String> availableYears;

        SystemReportDtoBuilder() {}

        public SystemReportDtoBuilder totalStudents(int totalStudents) { this.totalStudents = totalStudents; return this; }
        public SystemReportDtoBuilder totalTeachers(int totalTeachers) { this.totalTeachers = totalTeachers; return this; }
        public SystemReportDtoBuilder totalParents(int totalParents) { this.totalParents = totalParents; return this; }
        public SystemReportDtoBuilder totalClassrooms(int totalClassrooms) { this.totalClassrooms = totalClassrooms; return this; }
        public SystemReportDtoBuilder totalSubjects(int totalSubjects) { this.totalSubjects = totalSubjects; return this; }
        public SystemReportDtoBuilder totalAssignments(int totalAssignments) { this.totalAssignments = totalAssignments; return this; }
        public SystemReportDtoBuilder totalSubmitted(int totalSubmitted) { this.totalSubmitted = totalSubmitted; return this; }
        public SystemReportDtoBuilder pendingGrading(int pendingGrading) { this.pendingGrading = pendingGrading; return this; }
        public SystemReportDtoBuilder avgSubmissionRate(double avgSubmissionRate) { this.avgSubmissionRate = avgSubmissionRate; return this; }
        public SystemReportDtoBuilder avgAttendanceRate(double avgAttendanceRate) { this.avgAttendanceRate = avgAttendanceRate; return this; }
        public SystemReportDtoBuilder recentActivities(List<RecentActivityDto> recentActivities) { this.recentActivities = recentActivities; return this; }
        public SystemReportDtoBuilder subjectAchievements(List<SubjectAchievementDto> subjectAchievements) { this.subjectAchievements = subjectAchievements; return this; }
        public SystemReportDtoBuilder availableYears(List<String> availableYears) { this.availableYears = availableYears; return this; }

        public SystemReportDto build() {
            return new SystemReportDto(totalStudents, totalTeachers, totalParents, totalClassrooms, totalSubjects, totalAssignments, totalSubmitted, pendingGrading, avgSubmissionRate, avgAttendanceRate, recentActivities, subjectAchievements, availableYears);
        }
    }
}
