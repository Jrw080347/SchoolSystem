package com.school.dto;

public class BulkPromoteResultDto {
    private int promotedStudents;
    private int graduatedStudents;
    private int processedClassrooms;
    private int newClassroomsCreated;
    private String message;

    public BulkPromoteResultDto() {}

    public BulkPromoteResultDto(int promotedStudents, int graduatedStudents, int processedClassrooms, int newClassroomsCreated, String message) {
        this.promotedStudents = promotedStudents;
        this.graduatedStudents = graduatedStudents;
        this.processedClassrooms = processedClassrooms;
        this.newClassroomsCreated = newClassroomsCreated;
        this.message = message;
    }

    public int getPromotedStudents() {
        return promotedStudents;
    }

    public void setPromotedStudents(int promotedStudents) {
        this.promotedStudents = promotedStudents;
    }

    public int getGraduatedStudents() {
        return graduatedStudents;
    }

    public void setGraduatedStudents(int graduatedStudents) {
        this.graduatedStudents = graduatedStudents;
    }

    public int getProcessedClassrooms() {
        return processedClassrooms;
    }

    public void setProcessedClassrooms(int processedClassrooms) {
        this.processedClassrooms = processedClassrooms;
    }

    public int getNewClassroomsCreated() {
        return newClassroomsCreated;
    }

    public void setNewClassroomsCreated(int newClassroomsCreated) {
        this.newClassroomsCreated = newClassroomsCreated;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
