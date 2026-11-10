package com.school.dto;

import java.util.List;

public class BulkPromoteRequest {
    private List<Long> classroomIds;
    private String newAcademicYear;

    public BulkPromoteRequest() {}

    public BulkPromoteRequest(List<Long> classroomIds, String newAcademicYear) {
        this.classroomIds = classroomIds;
        this.newAcademicYear = newAcademicYear;
    }

    public List<Long> getClassroomIds() {
        return classroomIds;
    }

    public void setClassroomIds(List<Long> classroomIds) {
        this.classroomIds = classroomIds;
    }

    public String getNewAcademicYear() {
        return newAcademicYear;
    }

    public void setNewAcademicYear(String newAcademicYear) {
        this.newAcademicYear = newAcademicYear;
    }
}
