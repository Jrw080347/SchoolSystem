package com.school.dto;

public class SubjectAchievementDto {
    private Long id;
    private String subject;
    private String subjectCode;
    private Integer gradeLevel;
    private String gradeName;
    private String classroomName;
    private int totalAssignments;
    private int submittedCount;
    private int totalSubmissions;
    private int percent;
    private String color;

    public SubjectAchievementDto() {
    }

    public SubjectAchievementDto(String subject, int percent, String color) {
        this.subject = subject;
        this.percent = percent;
        this.color = color;
    }

    public SubjectAchievementDto(Long id, String subject, String subjectCode, Integer gradeLevel,
                                 String gradeName, String classroomName, int totalAssignments,
                                 int submittedCount, int totalSubmissions, int percent, String color) {
        this.id = id;
        this.subject = subject;
        this.subjectCode = subjectCode;
        this.gradeLevel = gradeLevel;
        this.gradeName = gradeName;
        this.classroomName = classroomName;
        this.totalAssignments = totalAssignments;
        this.submittedCount = submittedCount;
        this.totalSubmissions = totalSubmissions;
        this.percent = percent;
        this.color = color;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public Integer getGradeLevel() { return gradeLevel; }
    public void setGradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; }

    public String getGradeName() { return gradeName; }
    public void setGradeName(String gradeName) { this.gradeName = gradeName; }

    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }

    public int getTotalAssignments() { return totalAssignments; }
    public void setTotalAssignments(int totalAssignments) { this.totalAssignments = totalAssignments; }

    public int getSubmittedCount() { return submittedCount; }
    public void setSubmittedCount(int submittedCount) { this.submittedCount = submittedCount; }

    public int getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(int totalSubmissions) { this.totalSubmissions = totalSubmissions; }

    public int getPercent() { return percent; }
    public void setPercent(int percent) { this.percent = percent; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public static SubjectAchievementDtoBuilder builder() {
        return new SubjectAchievementDtoBuilder();
    }

    public static class SubjectAchievementDtoBuilder {
        private Long id;
        private String subject;
        private String subjectCode;
        private Integer gradeLevel;
        private String gradeName;
        private String classroomName;
        private int totalAssignments;
        private int submittedCount;
        private int totalSubmissions;
        private int percent;
        private String color;

        SubjectAchievementDtoBuilder() {}

        public SubjectAchievementDtoBuilder id(Long id) { this.id = id; return this; }
        public SubjectAchievementDtoBuilder subject(String subject) { this.subject = subject; return this; }
        public SubjectAchievementDtoBuilder subjectCode(String subjectCode) { this.subjectCode = subjectCode; return this; }
        public SubjectAchievementDtoBuilder gradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; return this; }
        public SubjectAchievementDtoBuilder gradeName(String gradeName) { this.gradeName = gradeName; return this; }
        public SubjectAchievementDtoBuilder classroomName(String classroomName) { this.classroomName = classroomName; return this; }
        public SubjectAchievementDtoBuilder totalAssignments(int totalAssignments) { this.totalAssignments = totalAssignments; return this; }
        public SubjectAchievementDtoBuilder submittedCount(int submittedCount) { this.submittedCount = submittedCount; return this; }
        public SubjectAchievementDtoBuilder totalSubmissions(int totalSubmissions) { this.totalSubmissions = totalSubmissions; return this; }
        public SubjectAchievementDtoBuilder percent(int percent) { this.percent = percent; return this; }
        public SubjectAchievementDtoBuilder color(String color) { this.color = color; return this; }

        public SubjectAchievementDto build() {
            return new SubjectAchievementDto(id, subject, subjectCode, gradeLevel, gradeName, classroomName,
                    totalAssignments, submittedCount, totalSubmissions, percent, color);
        }
    }
}
