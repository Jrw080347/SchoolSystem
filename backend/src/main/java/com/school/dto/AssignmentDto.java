package com.school.dto;

public class AssignmentDto {
    private Long id;
    private String title;
    private String description;
    private String assignedDate;
    private String dueDate;
    private Double maxScore;
    private String subjectName;
    private String classroomName;
    private int totalStudents;
    private int submittedCount;
    private int notSubmittedCount;
    private String status;

    public AssignmentDto() {
    }

    public AssignmentDto(Long id, String title, String description, String assignedDate,
                         String dueDate, Double maxScore, String subjectName,
                         String classroomName, int totalStudents, int submittedCount,
                         int notSubmittedCount) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assignedDate = assignedDate;
        this.dueDate = dueDate;
        this.maxScore = maxScore;
        this.subjectName = subjectName;
        this.classroomName = classroomName;
        this.totalStudents = totalStudents;
        this.submittedCount = submittedCount;
        this.notSubmittedCount = notSubmittedCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }

    public int getTotalStudents() { return totalStudents; }
    public void setTotalStudents(int totalStudents) { this.totalStudents = totalStudents; }

    public int getSubmittedCount() { return submittedCount; }
    public void setSubmittedCount(int submittedCount) { this.submittedCount = submittedCount; }

    public int getNotSubmittedCount() { return notSubmittedCount; }
    public void setNotSubmittedCount(int notSubmittedCount) { this.notSubmittedCount = notSubmittedCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static AssignmentDtoBuilder builder() {
        return new AssignmentDtoBuilder();
    }

    public static class AssignmentDtoBuilder {
        private Long id;
        private String title;
        private String description;
        private String assignedDate;
        private String dueDate;
        private Double maxScore;
        private String subjectName;
        private String classroomName;
        private int totalStudents;
        private int submittedCount;
        private int notSubmittedCount;
        private String status;

        AssignmentDtoBuilder() {}

        public AssignmentDtoBuilder id(Long id) { this.id = id; return this; }
        public AssignmentDtoBuilder title(String title) { this.title = title; return this; }
        public AssignmentDtoBuilder description(String description) { this.description = description; return this; }
        public AssignmentDtoBuilder assignedDate(String assignedDate) { this.assignedDate = assignedDate; return this; }
        public AssignmentDtoBuilder dueDate(String dueDate) { this.dueDate = dueDate; return this; }
        public AssignmentDtoBuilder maxScore(Double maxScore) { this.maxScore = maxScore; return this; }
        public AssignmentDtoBuilder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public AssignmentDtoBuilder classroomName(String classroomName) { this.classroomName = classroomName; return this; }
        public AssignmentDtoBuilder totalStudents(int totalStudents) { this.totalStudents = totalStudents; return this; }
        public AssignmentDtoBuilder submittedCount(int submittedCount) { this.submittedCount = submittedCount; return this; }
        public AssignmentDtoBuilder notSubmittedCount(int notSubmittedCount) { this.notSubmittedCount = notSubmittedCount; return this; }
        public AssignmentDtoBuilder status(String status) { this.status = status; return this; }

        public AssignmentDto build() {
            AssignmentDto dto = new AssignmentDto(id, title, description, assignedDate, dueDate, maxScore, subjectName, classroomName, totalStudents, submittedCount, notSubmittedCount);
            dto.setStatus(status);
            return dto;
        }
    }
}
