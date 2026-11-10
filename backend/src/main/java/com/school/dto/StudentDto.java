package com.school.dto;

public class StudentDto {
    private Long id;
    private String studentCode;
    private String firstName;
    private String lastName;
    private String dateOfBirth;
    private String gender;
    private String address;
    private Long classroomId;
    private String classroomName;
    private boolean isActive;
    private String status;

    public StudentDto() {
    }

    public StudentDto(Long id, String studentCode, String firstName, String lastName,
                      String dateOfBirth, String gender, String address,
                      Long classroomId, String classroomName, boolean isActive) {
        this.id = id;
        this.studentCode = studentCode;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.address = address;
        this.classroomId = classroomId;
        this.classroomName = classroomName;
        this.isActive = isActive;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentCode() { return studentCode; }
    public void setStudentCode(String studentCode) { this.studentCode = studentCode; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public String getClassroomName() { return classroomName; }
    public void setClassroomName(String classroomName) { this.classroomName = classroomName; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static StudentDtoBuilder builder() {
        return new StudentDtoBuilder();
    }

    public static class StudentDtoBuilder {
        private Long id;
        private String studentCode;
        private String firstName;
        private String lastName;
        private String dateOfBirth;
        private String gender;
        private String address;
        private Long classroomId;
        private String classroomName;
        private boolean isActive;
        private String status;

        StudentDtoBuilder() {}

        public StudentDtoBuilder id(Long id) { this.id = id; return this; }
        public StudentDtoBuilder studentCode(String studentCode) { this.studentCode = studentCode; return this; }
        public StudentDtoBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public StudentDtoBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public StudentDtoBuilder dateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; return this; }
        public StudentDtoBuilder gender(String gender) { this.gender = gender; return this; }
        public StudentDtoBuilder address(String address) { this.address = address; return this; }
        public StudentDtoBuilder classroomId(Long classroomId) { this.classroomId = classroomId; return this; }
        public StudentDtoBuilder classroomName(String classroomName) { this.classroomName = classroomName; return this; }
        public StudentDtoBuilder isActive(boolean isActive) { this.isActive = isActive; return this; }
        public StudentDtoBuilder status(String status) { this.status = status; return this; }

        public StudentDto build() {
            StudentDto dto = new StudentDto(id, studentCode, firstName, lastName, dateOfBirth, gender, address, classroomId, classroomName, isActive);
            dto.setStatus(status);
            return dto;
        }
    }
}
