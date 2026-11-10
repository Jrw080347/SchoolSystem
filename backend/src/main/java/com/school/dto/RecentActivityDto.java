package com.school.dto;

public class RecentActivityDto {
    private Long id;
    private String studentName;
    private String avatar;
    private String subject;
    private String task;
    private String status;
    private String statusLabel;
    private String date;
    private String action;
    private String actionType;

    public RecentActivityDto() {
    }

    public RecentActivityDto(Long id, String studentName, String avatar, String subject,
                             String task, String status, String statusLabel, String date,
                             String action, String actionType) {
        this.id = id;
        this.studentName = studentName;
        this.avatar = avatar;
        this.subject = subject;
        this.task = task;
        this.status = status;
        this.statusLabel = statusLabel;
        this.date = date;
        this.action = action;
        this.actionType = actionType;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getTask() { return task; }
    public void setTask(String task) { this.task = task; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusLabel() { return statusLabel; }
    public void setStatusLabel(String statusLabel) { this.statusLabel = statusLabel; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public static RecentActivityDtoBuilder builder() {
        return new RecentActivityDtoBuilder();
    }

    public static class RecentActivityDtoBuilder {
        private Long id;
        private String studentName;
        private String avatar;
        private String subject;
        private String task;
        private String status;
        private String statusLabel;
        private String date;
        private String action;
        private String actionType;

        RecentActivityDtoBuilder() {}

        public RecentActivityDtoBuilder id(Long id) { this.id = id; return this; }
        public RecentActivityDtoBuilder studentName(String studentName) { this.studentName = studentName; return this; }
        public RecentActivityDtoBuilder avatar(String avatar) { this.avatar = avatar; return this; }
        public RecentActivityDtoBuilder subject(String subject) { this.subject = subject; return this; }
        public RecentActivityDtoBuilder task(String task) { this.task = task; return this; }
        public RecentActivityDtoBuilder status(String status) { this.status = status; return this; }
        public RecentActivityDtoBuilder statusLabel(String statusLabel) { this.statusLabel = statusLabel; return this; }
        public RecentActivityDtoBuilder date(String date) { this.date = date; return this; }
        public RecentActivityDtoBuilder action(String action) { this.action = action; return this; }
        public RecentActivityDtoBuilder actionType(String actionType) { this.actionType = actionType; return this; }

        public RecentActivityDto build() {
            return new RecentActivityDto(id, studentName, avatar, subject, task, status, statusLabel, date, action, actionType);
        }
    }
}
