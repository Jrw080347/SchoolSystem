package com.school.dto;

public class TeacherSubjectDto {
    private Long id;
    private Long teacherId;
    private String teacherName;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private Long classroomId;
    private String classroomName;
    private String academicYear;
    private Integer semester;

    public TeacherSubjectDto() {
    }

    public TeacherSubjectDto(Long id, Long teacherId, String teacherName, Long subjectId,
                             String subjectName, String subjectCode, Long classroomId,
                             String classroomName, String academicYear, Integer semester) {
        this.id = id;
        this.teacherId = teacherId;
        this.teacherName = teacherName;
        this.subjectId = subjectId;
        this.subjectName = subjectName;
        this.subjectCode = subjectCode;
        this.classroomId = classroomId;
        this.classroomName = classroomName;
        this.academicYear = academicYear;
        this.semester = semester;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }

    public String getTeacherName() { return teacherName; }
    public void setTeacherName(String teacherName) { this.teacherName = teacherName; }

    public Long getSubjectId() { return subjectId; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public static TeacherSubjectDtoBuilder builder() {
        return new TeacherSubjectDtoBuilder();
    }

    public static class TeacherSubjectDtoBuilder {
        private Long id;
        private Long teacherId;
        private String teacherName;
        private Long subjectId;
        private String subjectName;
        private String subjectCode;
        private Long classroomId;
        private String classroomName;
        private String academicYear;
        private Integer semester;

        TeacherSubjectDtoBuilder() {}

        public TeacherSubjectDtoBuilder id(Long id) { this.id = id; return this; }
        public TeacherSubjectDtoBuilder teacherId(Long teacherId) { this.teacherId = teacherId; return this; }
        public TeacherSubjectDtoBuilder teacherName(String teacherName) { this.teacherName = teacherName; return this; }
        public TeacherSubjectDtoBuilder subjectId(Long subjectId) { this.subjectId = subjectId; return this; }
        public TeacherSubjectDtoBuilder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public TeacherSubjectDtoBuilder subjectCode(String subjectCode) { this.subjectCode = subjectCode; return this; }
        public TeacherSubjectDtoBuilder classroomId(Long classroomId) { this.classroomId = classroomId; return this; }
        public TeacherSubjectDtoBuilder classroomName(String classroomName) { this.classroomName = classroomName; return this; }
        public TeacherSubjectDtoBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public TeacherSubjectDtoBuilder semester(Integer semester) { this.semester = semester; return this; }

        public TeacherSubjectDto build() {
            return new TeacherSubjectDto(id, teacherId, teacherName, subjectId, subjectName, subjectCode, classroomId, classroomName, academicYear, semester);
        }
    }
}
