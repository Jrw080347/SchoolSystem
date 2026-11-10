package com.school.dto;

public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String fullName;

    public AuthResponse() {
    }

    public AuthResponse(String token, String username, String role, String fullName) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public static class AuthResponseBuilder {
        private String token;
        private String username;
        private String role;
        private String fullName;

        AuthResponseBuilder() {}

        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder username(String username) { this.username = username; return this; }
        public AuthResponseBuilder role(String role) { this.role = role; return this; }
        public AuthResponseBuilder fullName(String fullName) { this.fullName = fullName; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, username, role, fullName);
        }
    }
}
