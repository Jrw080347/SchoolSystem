package com.school.dto;

public class ClassroomDto {
    private Long id;
    private String name;
    private Integer gradeLevel;
    private String roomNumber;
    private Integer maxStudents;
    private String academicYear;
    private Long homeroomTeacherId;
    private String homeroomTeacherName;
    private int studentCount;

    public ClassroomDto() {
    }

    public ClassroomDto(Long id, String name, Integer gradeLevel, String roomNumber,
                        Integer maxStudents, String academicYear, Long homeroomTeacherId,
                        String homeroomTeacherName, int studentCount) {
        this.id = id;
        this.name = name;
        this.gradeLevel = gradeLevel;
        this.roomNumber = roomNumber;
        this.maxStudents = maxStudents;
        this.academicYear = academicYear;
        this.homeroomTeacherId = homeroomTeacherId;
        this.homeroomTeacherName = homeroomTeacherName;
        this.studentCount = studentCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getGradeLevel() { return gradeLevel; }
    public void setGradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public Integer getMaxStudents() { return maxStudents; }
    public void setMaxStudents(Integer maxStudents) { this.maxStudents = maxStudents; }

    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }

    public Long getHomeroomTeacherId() { return homeroomTeacherId; }
    public void setHomeroomTeacherId(Long homeroomTeacherId) { this.homeroomTeacherId = homeroomTeacherId; }

    public String getHomeroomTeacherName() { return homeroomTeacherName; }
    public void setHomeroomTeacherName(String homeroomTeacherName) { this.homeroomTeacherName = homeroomTeacherName; }

    public int getStudentCount() { return studentCount; }
    public void setStudentCount(int studentCount) { this.studentCount = studentCount; }

    public static ClassroomDtoBuilder builder() {
        return new ClassroomDtoBuilder();
    }

    public static class ClassroomDtoBuilder {
        private Long id;
        private String name;
        private Integer gradeLevel;
        private String roomNumber;
        private Integer maxStudents;
        private String academicYear;
        private Long homeroomTeacherId;
        private String homeroomTeacherName;
        private int studentCount;

        ClassroomDtoBuilder() {}

        public ClassroomDtoBuilder id(Long id) { this.id = id; return this; }
        public ClassroomDtoBuilder name(String name) { this.name = name; return this; }
        public ClassroomDtoBuilder gradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; return this; }
        public ClassroomDtoBuilder roomNumber(String roomNumber) { this.roomNumber = roomNumber; return this; }
        public ClassroomDtoBuilder maxStudents(Integer maxStudents) { this.maxStudents = maxStudents; return this; }
        public ClassroomDtoBuilder academicYear(String academicYear) { this.academicYear = academicYear; return this; }
        public ClassroomDtoBuilder homeroomTeacherId(Long homeroomTeacherId) { this.homeroomTeacherId = homeroomTeacherId; return this; }
        public ClassroomDtoBuilder homeroomTeacherName(String homeroomTeacherName) { this.homeroomTeacherName = homeroomTeacherName; return this; }
        public ClassroomDtoBuilder studentCount(int studentCount) { this.studentCount = studentCount; return this; }

        public ClassroomDto build() {
            return new ClassroomDto(id, name, gradeLevel, roomNumber, maxStudents, academicYear, homeroomTeacherId, homeroomTeacherName, studentCount);
        }
    }
}
