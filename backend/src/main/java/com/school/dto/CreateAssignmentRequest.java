package com.school.dto;

public class CreateAssignmentRequest {
    private String title;
    private String description;
    private Long teacherSubjectId;
    private String assignedDate;
    private String dueDate;
    private Double maxScore;

    public CreateAssignmentRequest() {
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getTeacherSubjectId() { return teacherSubjectId; }
    public void setTeacherSubjectId(Long teacherSubjectId) { this.teacherSubjectId = teacherSubjectId; }

    public String getAssignedDate() { return assignedDate; }
    public void setAssignedDate(String assignedDate) { this.assignedDate = assignedDate; }

    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }

    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }
}
