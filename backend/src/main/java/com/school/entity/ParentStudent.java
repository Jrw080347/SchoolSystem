package com.school.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "parent_student",
       uniqueConstraints = @UniqueConstraint(columnNames = {"parent_id","student_id"}))
public class ParentStudent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", nullable = false)
    private User parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(length = 50)
    private String relationship;

    public ParentStudent() {
    }

    public ParentStudent(Long id, User parent, Student student, String relationship) {
        this.id = id;
        this.parent = parent;
        this.student = student;
        this.relationship = relationship;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getParent() { return parent; }
    public void setParent(User parent) { this.parent = parent; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public static ParentStudentBuilder builder() {
        return new ParentStudentBuilder();
    }

    public static class ParentStudentBuilder {
        private Long id;
        private User parent;
        private Student student;
        private String relationship;

        ParentStudentBuilder() {}

        public ParentStudentBuilder id(Long id) { this.id = id; return this; }
        public ParentStudentBuilder parent(User parent) { this.parent = parent; return this; }
        public ParentStudentBuilder student(Student student) { this.student = student; return this; }
        public ParentStudentBuilder relationship(String relationship) { this.relationship = relationship; return this; }

        public ParentStudent build() {
            return new ParentStudent(id, parent, student, relationship);
        }
    }
}
