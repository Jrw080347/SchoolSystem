package com.school.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "subjects")
public class Subject {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column
    private Integer credits = 1;

    @Column(name = "grade_level")
    private Integer gradeLevel;

    @Column(name = "is_active")
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Subject() {
    }

    public Subject(Long id, String code, String name, String description,
                   Integer credits, Integer gradeLevel, Boolean active,
                   LocalDateTime createdAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.credits = credits != null ? credits : 1;
        this.gradeLevel = gradeLevel;
        this.active = active != null ? active : true;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
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

    public static SubjectBuilder builder() {
        return new SubjectBuilder();
    }

    public static class SubjectBuilder {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Integer credits;
        private Integer gradeLevel;
        private Boolean active;
        private LocalDateTime createdAt;

        SubjectBuilder() {}

        public SubjectBuilder id(Long id) { this.id = id; return this; }
        public SubjectBuilder code(String code) { this.code = code; return this; }
        public SubjectBuilder name(String name) { this.name = name; return this; }
        public SubjectBuilder description(String description) { this.description = description; return this; }
        public SubjectBuilder credits(Integer credits) { this.credits = credits; return this; }
        public SubjectBuilder gradeLevel(Integer gradeLevel) { this.gradeLevel = gradeLevel; return this; }
        public SubjectBuilder active(Boolean active) { this.active = active; return this; }
        public SubjectBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Subject build() {
            return new Subject(id, code, name, description, credits, gradeLevel, active, createdAt);
        }
    }
}
