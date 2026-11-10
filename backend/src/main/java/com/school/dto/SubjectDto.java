package com.school.dto;

import java.time.LocalDateTime;

public class SubjectDto {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Integer credits;
    private Integer gradeLevel;
    private Boolean active;
    private LocalDateTime createdAt;

    public SubjectDto() {
    }

    public SubjectDto(Long id, String code, String name, String description,
                      Integer credits, Integer gradeLevel, Boolean active,
                      LocalDateTime createdAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.credits = credits;
        this.gradeLevel = gradeLevel;
        this.active = active;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public Integer getGradeLevel() { return gradeLevel; }
    public void setGradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static SubjectDtoBuilder builder() {
        return new SubjectDtoBuilder();
    }

    public static class SubjectDtoBuilder {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Integer credits;
        private Integer gradeLevel;
        private Boolean active;
        private LocalDateTime createdAt;

        SubjectDtoBuilder() {}

        public SubjectDtoBuilder id(Long id) { this.id = id; return this; }
        public SubjectDtoBuilder code(String code) { this.code = code; return this; }
        public SubjectDtoBuilder name(String name) { this.name = name; return this; }
        public SubjectDtoBuilder description(String description) { this.description = description; return this; }
        public SubjectDtoBuilder credits(Integer credits) { this.credits = credits; return this; }
        public SubjectDtoBuilder gradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; return this; }
        public SubjectDtoBuilder active(Boolean active) { this.active = active; return this; }
        public SubjectDtoBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public SubjectDto build() {
            return new SubjectDto(id, code, name, description, credits, gradeLevel, active, createdAt);
        }
    }
}
