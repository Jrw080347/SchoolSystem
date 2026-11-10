package com.school.dto;

public class AttendanceDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String date;
    private String status;
    private String note;

    public AttendanceDto() {
    }

    public AttendanceDto(Long id, Long studentId, String studentName, String date, String status, String note) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.date = date;
        this.status = status;
        this.note = note;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public static AttendanceDtoBuilder builder() {
        return new AttendanceDtoBuilder();
    }

    public static class AttendanceDtoBuilder {
        private Long id;
        private Long studentId;
        private String studentName;
        private String date;
        private String status;
        private String note;

        AttendanceDtoBuilder() {}

        public AttendanceDtoBuilder id(Long id) { this.id = id; return this; }
        public AttendanceDtoBuilder studentId(Long studentId) { this.studentId = studentId; return this; }
        public AttendanceDtoBuilder studentName(String studentName) { this.studentName = studentName; return this; }
        public AttendanceDtoBuilder date(String date) { this.date = date; return this; }
        public AttendanceDtoBuilder status(String status) { this.status = status; return this; }
        public AttendanceDtoBuilder note(String note) { this.note = note; return this; }

        public AttendanceDto build() {
            return new AttendanceDto(id, studentId, studentName, date, status, note);
        }
    }
}
