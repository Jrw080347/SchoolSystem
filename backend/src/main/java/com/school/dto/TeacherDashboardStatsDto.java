package com.school.dto;

public class TeacherDashboardStatsDto {
    private int todayClassesCount;
    private int pendingGradingCount;
    private double avgAttendanceRate;

    public TeacherDashboardStatsDto() {
    }

    public TeacherDashboardStatsDto(int todayClassesCount, int pendingGradingCount, double avgAttendanceRate) {
        this.todayClassesCount = todayClassesCount;
        this.pendingGradingCount = pendingGradingCount;
        this.avgAttendanceRate = avgAttendanceRate;
    }

    public int getTodayClassesCount() { return todayClassesCount; }
    public void setTodayClassesCount(int todayClassesCount) { this.todayClassesCount = todayClassesCount; }

    public int getPendingGradingCount() { return pendingGradingCount; }
    public void setPendingGradingCount(int pendingGradingCount) { this.pendingGradingCount = pendingGradingCount; }

    public double getAvgAttendanceRate() { return avgAttendanceRate; }
    public void setAvgAttendanceRate(double avgAttendanceRate) { this.avgAttendanceRate = avgAttendanceRate; }

    public static TeacherDashboardStatsDtoBuilder builder() {
        return new TeacherDashboardStatsDtoBuilder();
    }

    public static class TeacherDashboardStatsDtoBuilder {
        private int todayClassesCount;
        private int pendingGradingCount;
        private double avgAttendanceRate;

        TeacherDashboardStatsDtoBuilder() {}

        public TeacherDashboardStatsDtoBuilder todayClassesCount(int todayClassesCount) { this.todayClassesCount = todayClassesCount; return this; }
        public TeacherDashboardStatsDtoBuilder pendingGradingCount(int pendingGradingCount) { this.pendingGradingCount = pendingGradingCount; return this; }
        public TeacherDashboardStatsDtoBuilder avgAttendanceRate(double avgAttendanceRate) { this.avgAttendanceRate = avgAttendanceRate; return this; }

        public TeacherDashboardStatsDto build() {
            return new TeacherDashboardStatsDto(todayClassesCount, pendingGradingCount, avgAttendanceRate);
        }
    }
}
