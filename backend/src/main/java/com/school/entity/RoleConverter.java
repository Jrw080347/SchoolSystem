package com.school.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RoleConverter implements AttributeConverter<User.Role, Integer> {

    @Override
    public Integer convertToDatabaseColumn(User.Role role) {
        return role == null ? null : role.getCode();
    }

    @Override
    public User.Role convertToEntityAttribute(Integer code) {
        return code == null ? null : User.Role.fromCode(code);
    }
}
