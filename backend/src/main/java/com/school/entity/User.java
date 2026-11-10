package com.school.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false)
    private String password;

    @Convert(converter = RoleConverter.class)
    @Column(nullable = false)
    private Role role;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(length = 20)
    private String phone;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "last_password_change")
    private LocalDateTime lastPasswordChange;

    public User() {
    }

    public User(Long id, String username, String password, Role role,
                String firstName, String lastName, String phone, Boolean isActive,
                LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.role = role;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public User(Long id, String username, String password, Role role,
                String firstName, String lastName, String phone, Boolean isActive,
                LocalDateTime createdAt, LocalDateTime updatedAt,
                LocalDateTime lastLogin, LocalDateTime lastPasswordChange) {
        this(id, username, password, role, firstName, lastName, phone, isActive, createdAt, updatedAt);
        this.lastLogin = lastLogin;
        this.lastPasswordChange = lastPasswordChange;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public boolean isActive() { return isActive != null ? isActive : true; }
    public void setActive(Boolean isActive) { this.isActive = isActive != null ? isActive : true; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public LocalDateTime getLastPasswordChange() { return lastPasswordChange; }
    public void setLastPasswordChange(LocalDateTime lastPasswordChange) { this.lastPasswordChange = lastPasswordChange; }

    public enum Role {
        ADMIN(1),
        TEACHER(2),
        HOMEROOM_TEACHER(3),
        PARENT(4);

        private final int code;

        Role(int code) {
            this.code = code;
        }

        public int getCode() {
            return code;
        }

        public static Role fromCode(int code) {
            for (Role role : values()) {
                if (role.code == code) {
                    return role;
                }
            }
            throw new IllegalArgumentException("ไม่พบบทบาทรหัส: " + code);
        }

        public static Role fromValue(String value) {
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("กรุณาระบุบทบาทผู้ใช้");
            }
            try {
                return fromCode(Integer.parseInt(value.trim()));
            } catch (NumberFormatException e) {
                return valueOf(value.trim().toUpperCase());
            }
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return isActive; }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String username;
        private String password;
        private Role role;
        private String firstName;
        private String lastName;
        private String phone;
        private Boolean isActive;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime lastLogin;
        private LocalDateTime lastPasswordChange;

        UserBuilder() {}

        public UserBuilder id(Long id) { this.id = id; return this; }
        public UserBuilder username(String username) { this.username = username; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }
        public UserBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserBuilder phone(String phone) { this.phone = phone; return this; }
        public UserBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public UserBuilder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public UserBuilder lastPasswordChange(LocalDateTime lastPasswordChange) { this.lastPasswordChange = lastPasswordChange; return this; }

        public User build() {
            return new User(id, username, password, role, firstName, lastName, phone, isActive, createdAt, updatedAt, lastLogin, lastPasswordChange);
        }
    }
}
