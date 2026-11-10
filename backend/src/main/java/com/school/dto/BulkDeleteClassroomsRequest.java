package com.school.dto;

import java.util.List;

public class BulkDeleteClassroomsRequest {
    private List<Long> classroomIds;

    public BulkDeleteClassroomsRequest() {}

    public BulkDeleteClassroomsRequest(List<Long> classroomIds) {
        this.classroomIds = classroomIds;
    }

    public List<Long> getClassroomIds() {
        return classroomIds;
    }

    public void setClassroomIds(List<Long> classroomIds) {
        this.classroomIds = classroomIds;
    }
}
