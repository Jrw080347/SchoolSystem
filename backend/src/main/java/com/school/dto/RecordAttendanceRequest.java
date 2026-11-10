package com.school.dto;

import java.util.List;

public class RecordAttendanceRequest {
    private Long classroomId;
    private String date;
    private List<StudentAttendance> attendances;

    public RecordAttendanceRequest() {
    }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<StudentAttendance> getAttendances() { return attendances; }
    public void setAttendances(List<StudentAttendance> attendances) { this.attendances = attendances; }

    public static class StudentAttendance {
        private Long studentId;
        private String status;
        private String note;

        public StudentAttendance() {
        }

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }
}
