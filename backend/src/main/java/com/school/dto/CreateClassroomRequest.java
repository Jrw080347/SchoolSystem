package com.school.dto;

public class CreateClassroomRequest {
    private String name;
    private Integer gradeLevel;
    private String roomNumber;
    private Integer maxStudents;
    private String academicYear;
    private Long homeroomTeacherId;

    public CreateClassroomRequest() {
    }

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
}
