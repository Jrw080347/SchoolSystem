package com.school.controller;

import com.school.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error("ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error("ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง"));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex) {
        if ("Bad credentials".equalsIgnoreCase(ex.getMessage())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ชื่อผู้ใช้ไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        return ResponseEntity.internalServerError().body(ApiResponse.error("เกิดข้อผิดพลาดภายในระบบ: " + ex.getMessage()));
    }
}
