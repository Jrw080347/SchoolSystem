package com.school.controller;

import com.school.dto.AuthRequest;
import com.school.dto.AuthResponse;
import com.school.entity.User;
import com.school.repository.UserRepository;
import com.school.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil, UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        User user = (User) userDetails;
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        String token = jwtUtil.generateToken(userDetails, user.getRole().name());

        return ResponseEntity.ok(AuthResponse.builder()
            .token(token)
            .username(user.getUsername())
            .role(user.getRole().name())
            .fullName(user.getFullName())
            .build());
    }
}
