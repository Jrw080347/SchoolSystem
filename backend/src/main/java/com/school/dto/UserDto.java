package com.school.dto;

import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String role;
    private String phone;
    private boolean isActive;
    private String classroom;
    private Integer gradeLevel;
    private String roomNumber;
    private String status;
    private LocalDateTime lastLogin;
    private LocalDateTime lastPasswordChange;
    private Integer graduationYear;
    private Long classroomId;

    public UserDto() {
    }

    public UserDto(Long id, String username, String firstName,
                   String lastName, String role, String phone, boolean isActive) {
        this.id = id;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.phone = phone;
        this.isActive = isActive;
    }

    public UserDto(Long id, String username, String firstName,
                   String lastName, String role, String phone, boolean isActive,
                   String classroom, Integer gradeLevel, String roomNumber) {
        this.id = id;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.phone = phone;
        this.isActive = isActive;
        this.classroom = classroom;
        this.gradeLevel = gradeLevel;
        this.roomNumber = roomNumber;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }

    public String getClassroom() { return classroom; }
    public void setClassroom(String classroom) { this.classroom = classroom; }

    public Integer getGradeLevel() { return gradeLevel; }
    public void setGradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public LocalDateTime getLastPasswordChange() { return lastPasswordChange; }
    public void setLastPasswordChange(LocalDateTime lastPasswordChange) { this.lastPasswordChange = lastPasswordChange; }

    public Integer getGraduationYear() { return graduationYear; }
    public void setGraduationYear(Integer graduationYear) { this.graduationYear = graduationYear; }

    public Long getClassroomId() { return classroomId; }
    public void setClassroomId(Long classroomId) { this.classroomId = classroomId; }

    public static UserDtoBuilder builder() {
        return new UserDtoBuilder();
    }

    public static class UserDtoBuilder {
        private Long id;
        private String username;
        private String firstName;
        private String lastName;
        private String role;
        private String phone;
        private boolean isActive;
        private String classroom;
        private Integer gradeLevel;
        private String roomNumber;
        private String status;
        private LocalDateTime lastLogin;
        private LocalDateTime lastPasswordChange;
        private Integer graduationYear;
        private Long classroomId;

        UserDtoBuilder() {}

        public UserDtoBuilder id(Long id) { this.id = id; return this; }
        public UserDtoBuilder username(String username) { this.username = username; return this; }
        public UserDtoBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserDtoBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserDtoBuilder role(String role) { this.role = role; return this; }
        public UserDtoBuilder phone(String phone) { this.phone = phone; return this; }
        public UserDtoBuilder isActive(boolean isActive) { this.isActive = isActive; return this; }
        public UserDtoBuilder classroom(String classroom) { this.classroom = classroom; return this; }
        public UserDtoBuilder gradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; return this; }
        public UserDtoBuilder roomNumber(String roomNumber) { this.roomNumber = roomNumber; return this; }
        public UserDtoBuilder status(String status) { this.status = status; return this; }
        public UserDtoBuilder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public UserDtoBuilder lastPasswordChange(LocalDateTime lastPasswordChange) { this.lastPasswordChange = lastPasswordChange; return this; }
        public UserDtoBuilder graduationYear(Integer graduationYear) { this.graduationYear = graduationYear; return this; }
        public UserDtoBuilder classroomId(Long classroomId) { this.classroomId = classroomId; return this; }

        public UserDto build() {
            UserDto dto = new UserDto(id, username, firstName, lastName, role, phone, isActive, classroom, gradeLevel, roomNumber);
            dto.setStatus(status);
            dto.setLastLogin(lastLogin);
            dto.setLastPasswordChange(lastPasswordChange);
            dto.setGraduationYear(graduationYear);
            dto.setClassroomId(classroomId);
            return dto;
        }
    }
}
