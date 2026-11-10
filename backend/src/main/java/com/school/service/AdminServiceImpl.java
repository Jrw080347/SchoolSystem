package com.school.service;

import com.school.dto.*;
import com.school.entity.*;
import com.school.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherSubjectRepository teacherSubjectRepository;
    private final ScheduleRepository scheduleRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionStatusRepository submissionStatusRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminServiceImpl(UserRepository userRepository,
                            StudentRepository studentRepository,
                            ClassroomRepository classroomRepository,
                            SubjectRepository subjectRepository,
                            TeacherSubjectRepository teacherSubjectRepository,
                            ScheduleRepository scheduleRepository,
                            AssignmentRepository assignmentRepository,
                            SubmissionStatusRepository submissionStatusRepository,
                            ParentStudentRepository parentStudentRepository,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.classroomRepository = classroomRepository;
        this.subjectRepository = subjectRepository;
        this.teacherSubjectRepository = teacherSubjectRepository;
        this.scheduleRepository = scheduleRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionStatusRepository = submissionStatusRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ==================== Users ====================

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> listUsers(String role) {
        return listUsers(role, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> listUsers(String role, Integer gradeLevel, String classroom, String search) {
        return listUsers(role, gradeLevel, classroom, search, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> listUsers(String role, Integer gradeLevel, String classroom, String search, String status) {
        return listUsers(role, gradeLevel, classroom, search, status, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> listUsers(String role, Integer gradeLevel, String classroom, String search, String status, Integer graduationYear) {
        List<UserDto> result = new ArrayList<>();

        if (role != null && role.equalsIgnoreCase("STUDENT")) {
            // Students are a separate entity, not in users table
            result.addAll(studentRepository.findAll().stream()
                    .map(this::studentToUserDto)
                    .collect(Collectors.toList()));
        } else if (role != null && !role.isEmpty()) {
            User.Role targetRole;
            try {
                targetRole = User.Role.fromValue(role);
            } catch (Exception e) {
                targetRole = null;
            }
            List<User> users = new ArrayList<>();
            if (targetRole == User.Role.TEACHER || (role != null && role.equalsIgnoreCase("TEACHER"))) {
                users.addAll(userRepository.findByRole(User.Role.TEACHER));
                users.addAll(userRepository.findByRole(User.Role.HOMEROOM_TEACHER));
            } else if (targetRole != null) {
                users = userRepository.findByRole(targetRole);
            } else {
                users = userRepository.findAll();
            }
            result.addAll(users.stream().map(this::toUserDto).collect(Collectors.toList()));
        } else {
            List<User> users = userRepository.findAll();
            result.addAll(users.stream().map(this::toUserDto).collect(Collectors.toList()));
            result.addAll(studentRepository.findAll().stream()
                    .map(this::studentToUserDto)
                    .collect(Collectors.toList()));
        }

        Set<Long> teacherIdsTeachingInClassroom = new HashSet<>();
        if ((classroom != null && !classroom.trim().isEmpty()) || gradeLevel != null) {
            List<TeacherSubject> tsList = teacherSubjectRepository.findAll();
            for (TeacherSubject ts : tsList) {
                if (ts.getClassroom() != null && ts.getTeacher() != null) {
                    boolean match = true;
                    if (gradeLevel != null) {
                        if (ts.getClassroom().getGradeLevel() == null || !ts.getClassroom().getGradeLevel().equals(gradeLevel)) {
                            match = false;
                        }
                    }
                    if (classroom != null && !classroom.trim().isEmpty()) {
                        String target = classroom.trim().toLowerCase();
                        String cName = ts.getClassroom().getName() != null ? ts.getClassroom().getName().toLowerCase() : "";
                        if (!cName.contains(target)) {
                            match = false;
                        }
                    }
                    if (match) {
                        teacherIdsTeachingInClassroom.add(ts.getTeacher().getId());
                    }
                }
            }
            List<Schedule> schedList = scheduleRepository.findAll();
            for (Schedule sch : schedList) {
                if (sch.getTeacherSubject() != null && sch.getTeacherSubject().getClassroom() != null && sch.getTeacherSubject().getTeacher() != null) {
                    boolean match = true;
                    if (gradeLevel != null) {
                        if (sch.getTeacherSubject().getClassroom().getGradeLevel() == null || !sch.getTeacherSubject().getClassroom().getGradeLevel().equals(gradeLevel)) {
                            match = false;
                        }
                    }
                    if (classroom != null && !classroom.trim().isEmpty()) {
                        String target = classroom.trim().toLowerCase();
                        String cName = sch.getTeacherSubject().getClassroom().getName() != null ? sch.getTeacherSubject().getClassroom().getName().toLowerCase() : "";
                        if (!cName.contains(target)) {
                            match = false;
                        }
                    }
                    if (match) {
                        teacherIdsTeachingInClassroom.add(sch.getTeacherSubject().getTeacher().getId());
                    }
                }
            }
        }

        // Filter by grade level, classroom, search, status if provided
        return result.stream()
                .filter(u -> {
                    if (status != null && !status.trim().isEmpty()) {
                        String targetStatus = status.trim();
                        if (u.getStatus() == null || !u.getStatus().equalsIgnoreCase(targetStatus)) {
                            return false;
                        }
                    }
                    if (graduationYear != null) {
                        if (u.getGraduationYear() == null || !u.getGraduationYear().equals(graduationYear)) {
                            return false;
                        }
                    }
                    boolean isTeacher = "TEACHER".equalsIgnoreCase(u.getRole());
                    boolean isHomeroom = "HOMEROOM_TEACHER".equalsIgnoreCase(u.getRole());

                    if (gradeLevel != null) {
                        boolean gradeMatch = false;
                        if (u.getGradeLevel() != null && u.getGradeLevel().equals(gradeLevel)) {
                            gradeMatch = true;
                        } else if (u.getClassroom() != null && u.getClassroom().contains("ป." + gradeLevel)) {
                            gradeMatch = true;
                        } else if (isTeacher && teacherIdsTeachingInClassroom.contains(u.getId())) {
                            gradeMatch = true;
                        } else if (isHomeroom && "TEACHER".equalsIgnoreCase(role) && teacherIdsTeachingInClassroom.contains(u.getId())) {
                            gradeMatch = true;
                        }
                        if (!gradeMatch) return false;
                    }
                    if (classroom != null && !classroom.trim().isEmpty()) {
                        String target = classroom.trim().toLowerCase();
                        boolean classroomMatch = false;
                        if (u.getClassroom() != null && u.getClassroom().toLowerCase().contains(target)) {
                            classroomMatch = true;
                        } else if (isTeacher && teacherIdsTeachingInClassroom.contains(u.getId())) {
                            classroomMatch = true;
                        } else if (isHomeroom && "TEACHER".equalsIgnoreCase(role) && teacherIdsTeachingInClassroom.contains(u.getId())) {
                            classroomMatch = true;
                        }
                        if (!classroomMatch) return false;
                    }
                    if (search != null && !search.trim().isEmpty()) {
                        String s = search.trim().toLowerCase();
                        boolean matchUsername = u.getUsername() != null && u.getUsername().toLowerCase().contains(s);
                        boolean matchName = (u.getFirstName() + " " + u.getLastName()).toLowerCase().contains(s);
                        boolean matchPhone = u.getPhone() != null && u.getPhone().toLowerCase().contains(s);
                        boolean matchCr = u.getClassroom() != null && u.getClassroom().toLowerCase().contains(s);
                        if (!matchUsername && !matchName && !matchPhone && !matchCr) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(u -> {
                    boolean isTeacherUser = "TEACHER".equalsIgnoreCase(u.getRole()) || "HOMEROOM_TEACHER".equalsIgnoreCase(u.getRole());
                    if (isTeacherUser && (classroom != null && !classroom.trim().isEmpty()) && teacherIdsTeachingInClassroom.contains(u.getId())) {
                        if (u.getClassroom() == null || u.getClassroom().isEmpty() || u.getClassroom().equals("-")) {
                            u.setClassroom(classroom);
                        } else if (!u.getClassroom().toLowerCase().contains(classroom.trim().toLowerCase())) {
                            u.setClassroom(u.getClassroom() + ", " + classroom);
                        }
                    }
                    return u;
                })
                .collect(Collectors.toList());
    }

    private UserDto studentToUserDto(Student s) {
        String classroomName = null;
        Integer gradeLevel = null;
        String roomNumber = null;
        if (s.getClassroom() != null) {
            classroomName = s.getClassroom().getName();
            gradeLevel = s.getClassroom().getGradeLevel();
            roomNumber = s.getClassroom().getRoomNumber();
        } else if ("GRADUATED".equalsIgnoreCase(s.getStatus())) {
            classroomName = "จบการศึกษา";
        }
        Integer gradYear = s.getGraduationYear();
        if (gradYear == null && "GRADUATED".equalsIgnoreCase(s.getStatus()) && s.getUpdatedAt() != null) {
            gradYear = s.getUpdatedAt().getYear() + 543;
        }
        return UserDto.builder()
                .id(s.getId())
                .username(s.getStudentCode())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .role("STUDENT")
                .classroom(classroomName)
                .gradeLevel(gradeLevel)
                .roomNumber(roomNumber)
                .phone(null)
                .isActive(s.isActive())
                .status("GRADUATED".equalsIgnoreCase(s.getStatus()) ? "GRADUATED" : (s.isActive() ? "ACTIVE" : "SUSPENDED"))
                .graduationYear(gradYear)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้ ID: " + id));
        return toUserDto(user);
    }

    @Override
    public UserDto updateUser(Long id, CreateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้ ID: " + id));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());

        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("กรุณากรอกเบอร์โทรศัพท์");
        }
        String phone = request.getPhone().trim();
        String cleanPhone = phone.replaceAll("[^0-9]", "").trim();
        if (cleanPhone.length() == 9 && (cleanPhone.startsWith("8") || cleanPhone.startsWith("9") || cleanPhone.startsWith("6"))) {
            cleanPhone = "0" + cleanPhone;
        }
        if (!cleanPhone.isEmpty()) {
            phone = cleanPhone;
        }
        if (!isValidPhoneNumber(phone)) {
            throw new RuntimeException("เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 06, 08 หรือ 09 และไม่มีช่องว่าง)");
        }
        user.setPhone(phone);

        if (request.getRole() != null) {
            user.setRole(User.Role.fromCode(request.getRole()));
        }
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            user.setActive("ACTIVE".equalsIgnoreCase(request.getStatus()));
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setLastPasswordChange(LocalDateTime.now());
        }

        User savedUser = userRepository.save(user);

        // Handle homeroom teacher classroom assignment
        if (savedUser.getRole() == User.Role.HOMEROOM_TEACHER && request.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + request.getClassroomId()));
            List<Classroom> existingCr = classroomRepository.findByHomeroomTeacherUsername(savedUser.getUsername());
            for (Classroom c : existingCr) {
                if (!c.getId().equals(classroom.getId())) {
                    c.setHomeroomTeacher(null);
                    classroomRepository.save(c);
                }
            }
            classroom.setHomeroomTeacher(savedUser);
            classroomRepository.save(classroom);
        } else if (savedUser.getRole() != User.Role.HOMEROOM_TEACHER) {
            List<Classroom> existingCr = classroomRepository.findByHomeroomTeacherUsername(savedUser.getUsername());
            for (Classroom c : existingCr) {
                c.setHomeroomTeacher(null);
                classroomRepository.save(c);
            }
        }

        return toUserDto(savedUser);
    }

    @Override
    public void resetPassword(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้ ID: " + id));
        user.setPassword(passwordEncoder.encode("123456"));
        user.setLastPasswordChange(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public void toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบผู้ใช้ ID: " + id));
        user.setActive(!user.isActive());
        userRepository.save(user);
    }

    // ==================== Import ====================

    @Override
    @Transactional
    public Object importTeachers(MultipartFile file) {
        List<Map<String, Object>> skippedRows = new ArrayList<>();
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            int imported = 0, skipped = 0;

            Row headerRow = sheet.getRow(0);
            Map<String, Integer> colMap = parseHeader(headerRow);

            int usernameCol = findCol(colMap, colMap.isEmpty() ? 0 : -1, "username", "ชื่อผู้ใช้", "ผู้ใช้", "ชื่อผู้ใช้งาน");
            int passwordCol = findCol(colMap, colMap.isEmpty() ? 1 : -1, "password", "รหัสผ่าน", "pass");
            int firstNameCol = findCol(colMap, colMap.isEmpty() ? 2 : -1, "firstname", "ชื่อ", "ชื่อจริง");
            int lastNameCol = findCol(colMap, colMap.isEmpty() ? 3 : -1, "lastname", "นามสกุล");
            int phoneCol = findCol(colMap, colMap.isEmpty() ? 4 : -1, "phone", "เบอร์โทร", "เบอร์โทรศัพท์", "telephone", "tel");

            Set<String> existingUsernames = userRepository.findAll().stream()
                    .map(User::getUsername)
                    .collect(Collectors.toSet());

            List<User> teachersToSave = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String username = usernameCol >= 0 ? getCellString(row, usernameCol) : "";
                String rawPassword = passwordCol >= 0 ? getCellString(row, passwordCol).trim() : "";
                String password = rawPassword.isEmpty() ? "123456" : rawPassword;
                String firstName = firstNameCol >= 0 ? getCellString(row, firstNameCol) : "";
                String lastName = lastNameCol >= 0 ? getCellString(row, lastNameCol) : "";
                String phone = phoneCol >= 0 ? getCellString(row, phoneCol) : "";
                String cleanPhone = phone.replaceAll("[^0-9]", "").trim();
                if (cleanPhone.length() == 9 && (cleanPhone.startsWith("8") || cleanPhone.startsWith("9") || cleanPhone.startsWith("6"))) {
                    cleanPhone = "0" + cleanPhone;
                }
                if (!cleanPhone.isEmpty()) {
                    phone = cleanPhone;
                }

                List<String> reasons = new ArrayList<>();
                if (username.isEmpty()) reasons.add("ไม่พบชื่อผู้ใช้ (username)");
                if (firstName.isEmpty()) reasons.add("ไม่พบชื่อ");
                if (lastName.isEmpty()) reasons.add("ไม่พบนามสกุล");
                if (!isValidPhoneNumber(phone)) reasons.add("เบอร์โทรศัพท์ไม่ถูกต้องหรือไม่ครบถ้วน");
                if (!username.isEmpty() && existingUsernames.contains(username)) reasons.add("ชื่อผู้ใช้ซ้ำในระบบ: " + username);

                if (!reasons.isEmpty()) {
                    skipped++;
                    String teacherName = (firstName + " " + lastName).trim();
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("row", i + 1);
                    detail.put("username", username.isEmpty() ? "ไม่ระบุชื่อผู้ใช้" : username);
                    detail.put("name", teacherName.isEmpty() ? (username.isEmpty() ? "ไม่ระบุชื่อ" : username) : teacherName);
                    detail.put("reasons", reasons);
                    skippedRows.add(detail);
                    continue;
                }

                User teacher = User.builder()
                        .username(username)
                        .password(passwordEncoder.encode(password.isEmpty() ? "123456" : password))
                        .firstName(firstName)
                        .lastName(lastName)
                        .phone(phone)
                        .role(User.Role.TEACHER)
                        .isActive(true)
                        .build();
                teachersToSave.add(teacher);
                existingUsernames.add(username);
                imported++;
            }

            if (!teachersToSave.isEmpty()) {
                userRepository.saveAll(teachersToSave);
            }

            return Map.of("imported", imported, "skipped", skipped, "skippedDetails", skippedRows);
        } catch (Exception e) {
            throw new RuntimeException("นำเข้าไฟล์ครูไม่สำเร็จ: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> getNextStudentSequenceInfo() {
        int beYear = LocalDate.now().getYear() + 543;
        String yearPrefix = String.format("%02d", beYear % 100);
        List<String> existingCodes = studentRepository.findStudentCodesStartingWith(yearPrefix);
        List<Student> allStudents = studentRepository.findAll();
        List<String> existingNames = allStudents.stream()
                .map(s -> (s.getFirstName() + " " + s.getLastName()).trim())
                .collect(Collectors.toList());
        int maxSeq = 0;
        for (String code : existingCodes) {
            if (code != null && code.startsWith(yearPrefix) && code.length() >= yearPrefix.length() + 3) {
                try {
                    int seq = Integer.parseInt(code.substring(yearPrefix.length()));
                    if (seq > maxSeq) {
                        maxSeq = seq;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        int nextSeq = maxSeq + 1;
        Map<String, Object> res = new HashMap<>();
        res.put("yearPrefix", yearPrefix);
        res.put("nextSeq", nextSeq);
        res.put("existingCodes", existingCodes);
        res.put("existingNames", existingNames);
        return res;
    }

    @Override
    @Transactional
    public Object importStudentsWithParents(MultipartFile file) {
        List<Map<String, Object>> skippedRows = new ArrayList<>();
        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            int imported = 0, skipped = 0;

            // Two last digits of Buddhist era year (e.g. 2567 -> "67", 2568 -> "68", 2569 -> "69")
            int beYear = LocalDate.now().getYear() + 543;
            String yearPrefix = String.format("%02d", beYear % 100);

            // Find existing student codes starting with yearPrefix
            List<String> existingCodes = studentRepository.findStudentCodesStartingWith(yearPrefix);
            Set<String> existingStudentCodeSet = new HashSet<>(existingCodes);

            // Preload students for duplicate check by name + dob or studentCode
            List<Student> allStudents = studentRepository.findAll();
            Set<String> existingNameSet = allStudents.stream()
                    .map(s -> (s.getFirstName() + "|" + s.getLastName() + "|" + (s.getDateOfBirth() != null ? s.getDateOfBirth().toString() : "")).trim().toLowerCase())
                    .collect(Collectors.toSet());
            Set<String> existingUsernames = userRepository.findAll().stream()
                    .map(User::getUsername)
                    .collect(Collectors.toSet());

            int maxSeq = 0;
            for (String code : existingCodes) {
                if (code != null && code.startsWith(yearPrefix) && code.length() >= yearPrefix.length() + 3) {
                    try {
                        int seq = Integer.parseInt(code.substring(yearPrefix.length()));
                        if (seq > maxSeq) {
                            maxSeq = seq;
                        }
                    } catch (NumberFormatException ignored) {}
                }
            }
            int nextSeq = maxSeq + 1;

            Row headerRow = sheet.getRow(0);
            Map<String, Integer> colMap = parseHeader(headerRow);

            int studentCodeCol = findCol(colMap, -1, "studentcode", "รหัสนักเรียน", "รหัส");
            int firstNameCol = findCol(colMap, colMap.isEmpty() ? 0 : -1, "firstname", "ชื่อ", "ชื่อนักเรียน", "ชื่อจริง");
            int lastNameCol = findCol(colMap, colMap.isEmpty() ? 1 : -1, "lastname", "นามสกุล", "นามสกุลนักเรียน");
            int genderCol = findCol(colMap, colMap.isEmpty() ? 2 : -1, "gender", "เพศ");
            int dobCol = findCol(colMap, colMap.isEmpty() ? 3 : -1, "dateofbirth", "วันเกิด", "วันเดือนปีเกิด");
            int classroomCol = findCol(colMap, colMap.isEmpty() ? 4 : -1, "classroom", "classroomcode", "ห้องเรียน", "รหัสห้องเรียน", "ชั้นเรียน");
            int parentFirstCol = findCol(colMap, colMap.isEmpty() ? 5 : -1, "parentfirstname", "ชื่อผู้ปกครอง");
            int parentLastCol = findCol(colMap, colMap.isEmpty() ? 6 : -1, "parentlastname", "นามสกุลผู้ปกครอง");
            int parentPhoneCol = findCol(colMap, colMap.isEmpty() ? 7 : -1, "parentphone", "เบอร์โทรผู้ปกครอง", "phone", "เบอร์โทร");
            int relCol = findCol(colMap, colMap.isEmpty() ? 8 : -1, "relationship", "ความสัมพันธ์");
            int parentPassCol = findCol(colMap, colMap.isEmpty() ? 9 : -1, "parentpassword", "รหัสผ่านผู้ปกครอง", "passwordผู้ปกครอง", "password", "รหัสผ่าน");
            int parentUserCol = findCol(colMap, -1, "parentusername", "ชื่อผู้ใช้ผู้ปกครอง", "usernameผู้ปกครอง", "username");

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String studentCode = studentCodeCol >= 0 ? getCellString(row, studentCodeCol) : "";
                String firstName = firstNameCol >= 0 ? getCellString(row, firstNameCol) : "";
                String lastName = lastNameCol >= 0 ? getCellString(row, lastNameCol) : "";
                String gender = genderCol >= 0 ? getCellString(row, genderCol) : "";
                String dateOfBirth = dobCol >= 0 ? getCellString(row, dobCol) : "";
                String parentUsername = parentUserCol >= 0 ? getCellString(row, parentUserCol) : "";
                String parentFirstName = parentFirstCol >= 0 ? getCellString(row, parentFirstCol) : "";
                String parentLastName = parentLastCol >= 0 ? getCellString(row, parentLastCol) : "";
                String parentPhone = parentPhoneCol >= 0 ? getCellString(row, parentPhoneCol) : "";
                String relationship = relCol >= 0 ? getCellString(row, relCol) : "";
                String rawParentPassword = parentPassCol >= 0 ? getCellString(row, parentPassCol).trim() : "";
                String parentPassword = rawParentPassword.isEmpty() ? "123456" : rawParentPassword;
                String classroomCode = classroomCol >= 0 ? getCellString(row, classroomCol) : "";

                List<String> reasons = new ArrayList<>();
                if (firstName.isEmpty()) reasons.add("ไม่พบชื่อนักเรียน");
                if (lastName.isEmpty()) reasons.add("ไม่พบนามสกุลนักเรียน");
                if (gender.isEmpty()) {
                    reasons.add("ยังไม่ระบุเพศ");
                } else {
                    String gUpper = gender.trim().toUpperCase();
                    if (!gUpper.equals("MALE") && !gUpper.equals("FEMALE") && !gender.equals("ชาย") && !gender.equals("หญิง")) {
                        reasons.add("เพศไม่ถูกต้อง (ต้องเป็น ชาย หรือ หญิง)");
                    }
                }

                LocalDate parsedDob = null;
                if (!dateOfBirth.isEmpty()) {
                    parsedDob = parseFlexibleDate(dateOfBirth);
                    if (parsedDob == null) {
                        reasons.add("รูปแบบวันเกิดไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ DD/MM/YYYY)");
                    }
                }

                // Check duplicate
                boolean isDuplicate = false;
                if (!studentCode.isEmpty()) {
                    if (existingStudentCodeSet.contains(studentCode)) {
                        reasons.add("รหัสนักเรียนซ้ำในระบบ: " + studentCode);
                        isDuplicate = true;
                    }
                } else {
                    String nameDobKey = (firstName.trim() + "|" + lastName.trim() + "|" + (parsedDob != null ? parsedDob.toString() : "")).toLowerCase();
                    if (existingNameSet.contains(nameDobKey)) {
                        reasons.add("ชื่อ-นามสกุลและวันเกิดซ้ำกับนักเรียนที่มีอยู่แล้วในระบบ");
                        isDuplicate = true;
                    }
                }

                // Parent phone validation if parent info is provided
                boolean hasParentInfo = !parentFirstName.isEmpty() || !parentLastName.isEmpty() || !parentUsername.isEmpty() || !relationship.isEmpty() || !parentPhone.isEmpty();
                String cleanParentPhone = "";
                if (hasParentInfo) {
                    cleanParentPhone = parentPhone.replaceAll("[^0-9]", "").trim();
                    if (cleanParentPhone.length() == 9 && (cleanParentPhone.startsWith("8") || cleanParentPhone.startsWith("9") || cleanParentPhone.startsWith("6"))) {
                        cleanParentPhone = "0" + cleanParentPhone;
                    }
                    if (!cleanParentPhone.isEmpty() && !isValidPhoneNumber(cleanParentPhone)) {
                        reasons.add("เบอร์โทรศัพท์ผู้ปกครองไม่ถูกต้อง (ต้องเป็น 10 หลัก ขึ้นต้นด้วย 06, 08, 09)");
                    }
                }

                if (!reasons.isEmpty() || isDuplicate) {
                    skipped++;
                    String fullName = (firstName + " " + lastName).trim();
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("row", i + 1);
                    detail.put("studentName", fullName.isEmpty() ? "ไม่ระบุชื่อ" : fullName);
                    detail.put("studentCode", studentCode);
                    detail.put("reasons", reasons);
                    skippedRows.add(detail);
                    continue;
                }

                // Auto-generate student code if not provided
                if (studentCode.isEmpty()) {
                    String generated;
                    do {
                        generated = String.format("%s%03d", yearPrefix, nextSeq++);
                    } while (existingStudentCodeSet.contains(generated));
                    studentCode = generated;
                }
                existingStudentCodeSet.add(studentCode);
                existingNameSet.add((firstName.trim() + "|" + lastName.trim() + "|" + (parsedDob != null ? parsedDob.toString() : "")).toLowerCase());

                Student student = Student.builder()
                        .studentCode(studentCode)
                        .firstName(firstName)
                        .lastName(lastName)
                        .dateOfBirth(parsedDob)
                        .gender((gender.equalsIgnoreCase("FEMALE") || gender.equals("หญิง")) ? Student.Gender.FEMALE : Student.Gender.MALE)
                        .isActive(true)
                        .build();

                // Parse classroom code: e.g. 101 = grade 1 room 01, 203 = grade 2 room 03, max grade 6
                if (!classroomCode.isEmpty()) {
                    try {
                        int code = Integer.parseInt(classroomCode.trim());
                        int gradeLevel = code / 100;       // 101 -> 1, 203 -> 2, 601 -> 6
                        int roomNum = code % 100;           // 101 -> 1, 203 -> 3
                        if (gradeLevel >= 1 && gradeLevel <= 6 && roomNum >= 1) {
                            String roomNumber = String.valueOf(roomNum);
                            Classroom classroom = classroomRepository.findFirstByGradeLevelAndRoomNumberOrderByIdDesc(gradeLevel, roomNumber)
                                    .orElseGet(() -> {
                                        // Auto-create classroom if not exists
                                        String currentYear = String.valueOf(java.time.LocalDate.now().getYear() + 543);
                                        String name = "ป." + gradeLevel + "/" + roomNum;
                                        Classroom newClassroom = Classroom.builder()
                                                .name(name)
                                                .gradeLevel(gradeLevel)
                                                .roomNumber(roomNumber)
                                                .maxStudents(30)
                                                .academicYear(currentYear)
                                                .isActive(true)
                                                .build();
                                        return classroomRepository.save(newClassroom);
                                    });
                            student.setClassroom(classroom);
                        }
                    } catch (NumberFormatException ignored) {
                        // invalid classroom code, skip classroom assignment
                    }
                }

                studentRepository.save(student);

                // หากมีข้อมูลผู้ปกครอง ให้สร้างหรือผูกบัญชีผู้ปกครอง
                // ลำดับการกำหนด Username ผู้ปกครอง:
                // 1) หากระบุ parentUsername ใน Excel ให้ใช้ค่านั้น
                // 2) หากไม่ได้ระบุ ให้ใช้เบอร์โทรศัพท์ผู้ปกครอง (ทำให้ผู้ปกครองคนเดียวกันที่มีลูกหลายคน ใช้บัญชีเดียวกันเข้าดูนักเรียนได้ทุกคน)
                // 3) หากไม่มีทั้งคู่ ให้ fallback เป็น studentCode (รหัสนักเรียน)
                if (hasParentInfo) {
                    String finalParentUsername;
                    if (!parentUsername.isEmpty()) {
                        finalParentUsername = parentUsername;
                    } else if (!cleanParentPhone.isEmpty()) {
                        finalParentUsername = cleanParentPhone;
                    } else {
                        finalParentUsername = studentCode;
                    }

                    String finalParentPassword = parentPassword;
                    String finalStoredPhone = !cleanParentPhone.isEmpty() ? cleanParentPhone : parentPhone;

                    User parent = userRepository.findByUsername(finalParentUsername).orElse(null);
                    if (parent == null) {
                        parent = User.builder()
                                .username(finalParentUsername)
                                .password(passwordEncoder.encode(finalParentPassword.isEmpty() ? "123456" : finalParentPassword))
                                .firstName(parentFirstName.isEmpty() ? "ผู้ปกครอง" : parentFirstName)
                                .lastName(parentLastName.isEmpty() ? "-" : parentLastName)
                                .phone(finalStoredPhone)
                                .role(User.Role.PARENT)
                                .isActive(true)
                                .build();
                        userRepository.save(parent);
                        existingUsernames.add(finalParentUsername);
                    } else {
                        // อัปเดตเบอร์โทรหากบัญชีเดิมยังไม่มีเบอร์โทร
                        if ((parent.getPhone() == null || parent.getPhone().isBlank()) && !finalStoredPhone.isBlank()) {
                            parent.setPhone(finalStoredPhone);
                            userRepository.save(parent);
                        }
                    }

                    // ผูกบัญชีผู้ปกครองกับนักเรียน (ป้องกันการบันทึกผูกซ้ำ)
                    if (!parentStudentRepository.existsByParentIdAndStudentId(parent.getId(), student.getId())) {
                        ParentStudent ps = ParentStudent.builder()
                                .parent(parent)
                                .student(student)
                                .relationship(relationship.isEmpty() ? "ผู้ปกครอง" : relationship)
                                .build();
                        parentStudentRepository.save(ps);
                    }
                }
                imported++;
            }
            return Map.of("imported", imported, "skipped", skipped, "skippedDetails", skippedRows);
        } catch (Exception e) {
            throw new RuntimeException("นำเข้านักเรียนและผู้ปกครองไม่สำเร็จ: " + e.getMessage(), e);
        }
    }

    private Map<String, Integer> parseHeader(Row headerRow) {
        Map<String, Integer> colMap = new HashMap<>();
        if (headerRow != null) {
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                String val = getCellString(headerRow, c).toLowerCase().replaceAll("[_\\-\\s]", "");
                if (!val.isEmpty()) {
                    colMap.put(val, c);
                }
            }
        }
        return colMap;
    }

    private boolean isValidPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            return false;
        }
        return phone.matches("^0[689]\\d{8}$");
    }

    private int findCol(Map<String, Integer> colMap, int defaultIndex, String... aliases) {
        if (colMap == null || colMap.isEmpty()) return defaultIndex;
        for (String alias : aliases) {
            String clean = alias.toLowerCase().replaceAll("[_\\-\\s]", "");
            if (colMap.containsKey(clean)) {
                return colMap.get(clean);
            }
        }
        return defaultIndex;
    }

    // ==================== Classrooms ====================

    @Override
    public ClassroomDto createClassroom(CreateClassroomRequest request) {
        if (classroomRepository.existsByNameAndAcademicYear(request.getName(), request.getAcademicYear())) {
            throw new RuntimeException("ห้องเรียน " + request.getName() + " ปีการศึกษา " + request.getAcademicYear() + " มีอยู่แล้ว");
        }
        try {
            int roomNum = Integer.parseInt(request.getRoomNumber());
            if (roomNum < 1) throw new RuntimeException("หมายเลขห้องต้องมากกว่า 0");
        } catch (NumberFormatException e) {
            throw new RuntimeException("หมายเลขห้องต้องเป็นตัวเลขเท่านั้น");
        }

        Classroom classroom = new Classroom();
        classroom.setName(request.getName());
        classroom.setGradeLevel(request.getGradeLevel());
        classroom.setRoomNumber(request.getRoomNumber());
        classroom.setMaxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 30);
        classroom.setAcademicYear(request.getAcademicYear());
        if (request.getHomeroomTeacherId() != null) {
            User teacher = userRepository.findById(request.getHomeroomTeacherId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบครู ID: " + request.getHomeroomTeacherId()));
            classroomRepository.findAll().stream()
                    .filter(c -> c.getHomeroomTeacher() != null
                            && c.getHomeroomTeacher().getId().equals(teacher.getId())
                            && (request.getAcademicYear() == null || c.getAcademicYear().equals(request.getAcademicYear())))
                    .findFirst()
                    .ifPresent(other -> {
                        throw new RuntimeException("ครู " + teacher.getFullName() + " เป็นครูประจำชั้นห้อง " + other.getName() + " อยู่แล้ว");
                    });
            classroom.setHomeroomTeacher(teacher);
            // เปลี่ยน role จาก TEACHER เป็น HOMEROOM_TEACHER
            if (teacher.getRole() == User.Role.TEACHER) {
                teacher.setRole(User.Role.HOMEROOM_TEACHER);
                userRepository.save(teacher);
            }
        }
        return toClassroomDto(classroomRepository.save(classroom));
    }

    @Override
    public List<ClassroomDto> createBulkClassrooms(List<CreateClassroomRequest> requests) {
        List<ClassroomDto> results = new ArrayList<>();
        for (CreateClassroomRequest request : requests) {
            results.add(createClassroom(request));
        }
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomDto> listClassrooms() {
        return classroomRepository.findAll().stream()
                .map(this::toClassroomDto)
                .collect(Collectors.toList());
    }

    @Override
    public ClassroomDto updateClassroom(Long id, CreateClassroomRequest request) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + id));
        if (classroomRepository.existsByNameAndAcademicYearAndIdNot(request.getName(), request.getAcademicYear(), id)) {
            throw new RuntimeException("ห้องเรียน " + request.getName() + " ปีการศึกษา " + request.getAcademicYear() + " มีอยู่แล้ว");
        }
        classroom.setName(request.getName());
        classroom.setGradeLevel(request.getGradeLevel());
        classroom.setRoomNumber(request.getRoomNumber());
        classroom.setMaxStudents(request.getMaxStudents() != null ? request.getMaxStudents() : 30);
        classroom.setAcademicYear(request.getAcademicYear());
        User oldTeacher = classroom.getHomeroomTeacher();
        if (request.getHomeroomTeacherId() != null) {
            User teacher = userRepository.findById(request.getHomeroomTeacherId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบครู ID: " + request.getHomeroomTeacherId()));
            classroomRepository.findAll().stream()
                    .filter(c -> !c.getId().equals(id)
                            && c.getHomeroomTeacher() != null
                            && c.getHomeroomTeacher().getId().equals(teacher.getId())
                            && (request.getAcademicYear() == null || c.getAcademicYear().equals(request.getAcademicYear())))
                    .findFirst()
                    .ifPresent(other -> {
                        throw new RuntimeException("ครู " + teacher.getFullName() + " เป็นครูประจำชั้นห้อง " + other.getName() + " อยู่แล้ว");
                    });
            classroom.setHomeroomTeacher(teacher);
            // เปลี่ยน role จาก TEACHER เป็น HOMEROOM_TEACHER
            if (teacher.getRole() == User.Role.TEACHER) {
                teacher.setRole(User.Role.HOMEROOM_TEACHER);
                userRepository.save(teacher);
            }
        } else {
            classroom.setHomeroomTeacher(null);
        }
        Classroom saved = classroomRepository.save(classroom);
        if (oldTeacher != null && (request.getHomeroomTeacherId() == null || !oldTeacher.getId().equals(request.getHomeroomTeacherId()))) {
            boolean hasOther = classroomRepository.findAll().stream()
                    .anyMatch(c -> !c.getId().equals(id)
                            && c.getHomeroomTeacher() != null
                            && c.getHomeroomTeacher().getId().equals(oldTeacher.getId()));
            if (!hasOther && oldTeacher.getRole() == User.Role.HOMEROOM_TEACHER) {
                oldTeacher.setRole(User.Role.TEACHER);
                userRepository.save(oldTeacher);
            }
        }
        return toClassroomDto(saved);
    }

    @Override
    public void deleteClassroom(Long id) {
        throw new RuntimeException("ไม่อนุญาตให้ลบห้องเรียนในระบบ");
    }

    @Override
    @Transactional
    public BulkPromoteResultDto bulkPromoteClassrooms(BulkPromoteRequest request) {
        if (request.getClassroomIds() == null || request.getClassroomIds().isEmpty()) {
            throw new RuntimeException("กรุณาเลือกห้องเรียนที่ต้องการเลื่อนชั้น");
        }

        List<Classroom> classrooms = classroomRepository.findAllById(request.getClassroomIds());
        if (classrooms.isEmpty()) {
            throw new RuntimeException("ไม่พบห้องเรียนที่เลือก");
        }

        // Sort descending by grade level so higher grades are processed first (e.g. Grade 6 graduates and vacates first)
        classrooms.sort((a, b) -> Integer.compare(b.getGradeLevel(), a.getGradeLevel()));

        int promotedCount = 0;
        int graduatedCount = 0;
        int processedClassrooms = 0;
        int newClassroomsCreated = 0;

        for (Classroom currentRoom : classrooms) {
            List<Student> students = studentRepository.findByClassroomId(currentRoom.getId());
            if (students.isEmpty()) {
                processedClassrooms++;
                continue;
            }

            if (currentRoom.getGradeLevel() >= 6) {
                // Grade 6: Graduate
                int currentGradYear = LocalDate.now().getYear() + 543;
                if (request.getNewAcademicYear() != null && !request.getNewAcademicYear().trim().isEmpty()) {
                    try {
                        currentGradYear = Integer.parseInt(request.getNewAcademicYear().trim());
                    } catch (NumberFormatException ignored) {}
                }
                for (Student student : students) {
                    student.setClassroom(null);
                    student.setStatus("GRADUATED");
                    student.setGraduationYear(currentGradYear);
                    studentRepository.save(student);
                    graduatedCount++;
                }
            } else {
                // Grade 1-5: Promote to next grade level
                int nextGrade = currentRoom.getGradeLevel() + 1;
                String roomNum = currentRoom.getRoomNumber();
                String targetYear = (request.getNewAcademicYear() != null && !request.getNewAcademicYear().trim().isEmpty())
                        ? request.getNewAcademicYear().trim()
                        : currentRoom.getAcademicYear();

                // Check if target classroom exists
                boolean exists = classroomRepository
                        .findByGradeLevelAndRoomNumberAndAcademicYear(nextGrade, roomNum, targetYear).isPresent() ||
                        classroomRepository.findFirstByGradeLevelAndRoomNumberOrderByIdDesc(nextGrade, roomNum).isPresent();

                Classroom targetRoom = classroomRepository
                        .findByGradeLevelAndRoomNumberAndAcademicYear(nextGrade, roomNum, targetYear)
                        .orElseGet(() -> {
                            return classroomRepository
                                    .findFirstByGradeLevelAndRoomNumberOrderByIdDesc(nextGrade, roomNum)
                                    .orElseGet(() -> {
                                        Classroom newRoom = new Classroom();
                                        newRoom.setName("ป." + nextGrade + "/" + roomNum);
                                        newRoom.setGradeLevel(nextGrade);
                                        newRoom.setRoomNumber(roomNum);
                                        newRoom.setAcademicYear(targetYear);
                                        newRoom.setMaxStudents(currentRoom.getMaxStudents() != null ? currentRoom.getMaxStudents() : 30);
                                        newRoom.setHomeroomTeacher(null);
                                        newRoom.setActive(true);
                                        return classroomRepository.save(newRoom);
                                    });
                        });

                if (!exists) {
                    newClassroomsCreated++;
                }

                for (Student student : students) {
                    student.setClassroom(targetRoom);
                    student.setStatus("ACTIVE");
                    studentRepository.save(student);
                    promotedCount++;
                }
            }

            // Optionally update academic year of current classroom if requested
            if (request.getNewAcademicYear() != null && !request.getNewAcademicYear().trim().isEmpty()) {
                currentRoom.setAcademicYear(request.getNewAcademicYear().trim());
                classroomRepository.save(currentRoom);
            }

            processedClassrooms++;
        }

        StringBuilder msgBuilder = new StringBuilder();
        msgBuilder.append(String.format("เลื่อนชั้นสำเร็จ: นักเรียนเลื่อนชั้น %d คน, จบการศึกษา %d คน จากทั้งหมด %d ห้องเรียน (ครูประจำชั้นยังคงอยู่ห้องเดิม)",
                promotedCount, graduatedCount, processedClassrooms));
        if (newClassroomsCreated > 0) {
            msgBuilder.append(String.format(" ⚠️ มีการสร้างห้องเรียนใหม่ %d ห้องอัตโนมัติ กรุณาเข้าไปเลือกตั้งค่าอาจารย์ที่ปรึกษา (ครูประจำชั้น) ให้เรียบร้อย", newClassroomsCreated));
        }

        String msg = msgBuilder.toString();

        return new BulkPromoteResultDto(promotedCount, graduatedCount, processedClassrooms, newClassroomsCreated, msg);
    }

    @Override
    @Transactional
    public BulkPromoteResultDto promoteAllClassrooms() {
        List<Classroom> classrooms = classroomRepository.findAll();
        if (classrooms.isEmpty()) {
            throw new RuntimeException("ไม่พบห้องเรียนในระบบ");
        }

        // Sort descending by grade level so Grade 6 processes first
        classrooms.sort((a, b) -> Integer.compare(b.getGradeLevel(), a.getGradeLevel()));

        int promotedCount = 0;
        int graduatedCount = 0;
        int processedClassrooms = 0;
        int newClassroomsCreated = 0;

        for (Classroom currentRoom : classrooms) {
            List<Student> students = studentRepository.findByClassroomId(currentRoom.getId());

            String currentYearStr = currentRoom.getAcademicYear();
            int currentYearInt = 2568;
            try {
                currentYearInt = Integer.parseInt(currentYearStr);
            } catch (Exception ignored) {
                currentYearInt = LocalDate.now().getYear() + 543;
            }
            int nextYearInt = currentYearInt + 1;
            String nextYearStr = String.valueOf(nextYearInt);

            if (currentRoom.getGradeLevel() >= 6) {
                // Grade 6: Graduate students. Classroom academic year increases by 1, gradeLevel remains 6.
                for (Student student : students) {
                    student.setClassroom(null);
                    student.setStatus("GRADUATED");
                    student.setGraduationYear(currentYearInt);
                    studentRepository.save(student);
                    graduatedCount++;
                }
                currentRoom.setAcademicYear(nextYearStr);
                classroomRepository.save(currentRoom);
            } else {
                // Grade 1-5: Promote students to target room (next grade level, same room number, academic year + 1)
                int nextGrade = currentRoom.getGradeLevel() + 1;
                String roomNum = currentRoom.getRoomNumber();

                boolean exists = classroomRepository
                        .findByGradeLevelAndRoomNumberAndAcademicYear(nextGrade, roomNum, nextYearStr).isPresent();

                Classroom targetRoom = classroomRepository
                        .findByGradeLevelAndRoomNumberAndAcademicYear(nextGrade, roomNum, nextYearStr)
                        .orElseGet(() -> {
                            Classroom newRoom = new Classroom();
                            newRoom.setName("ป." + nextGrade + "/" + roomNum);
                            newRoom.setGradeLevel(nextGrade);
                            newRoom.setRoomNumber(roomNum);
                            newRoom.setAcademicYear(nextYearStr);
                            newRoom.setMaxStudents(currentRoom.getMaxStudents() != null ? currentRoom.getMaxStudents() : 30);
                            newRoom.setHomeroomTeacher(null);
                            newRoom.setActive(true);
                            return classroomRepository.save(newRoom);
                        });

                if (!exists) {
                    newClassroomsCreated++;
                }

                for (Student student : students) {
                    student.setClassroom(targetRoom);
                    student.setStatus("ACTIVE");
                    studentRepository.save(student);
                    promotedCount++;
                }

                currentRoom.setAcademicYear(nextYearStr);
                classroomRepository.save(currentRoom);
            }
            processedClassrooms++;
        }

        StringBuilder msgBuilder = new StringBuilder();
        msgBuilder.append(String.format("เลื่อนชั้นทั้งโรงเรียนสำเร็จ: นักเรียนเลื่อนชั้น %d คน, จบการศึกษา %d คน จากทั้งหมด %d ห้องเรียน (ครูประจำชั้นยังคงอยู่ห้องเดิม)",
                promotedCount, graduatedCount, processedClassrooms));
        if (newClassroomsCreated > 0) {
            msgBuilder.append(String.format(" ⚠️ มีการสร้างห้องเรียนใหม่ %d ห้องอัตโนมัติ กรุณาเข้าไปเลือกตั้งค่าอาจารย์ที่ปรึกษา (ครูประจำชั้น) ให้เรียบร้อย", newClassroomsCreated));
        }

        String msg = msgBuilder.toString();

        return new BulkPromoteResultDto(promotedCount, graduatedCount, processedClassrooms, newClassroomsCreated, msg);
    }

    @Override
    @Transactional
    public void bulkDeleteClassrooms(List<Long> classroomIds) {
        throw new RuntimeException("ไม่อนุญาตให้ลบห้องเรียนในระบบ");
    }

    @Override
    public void addStudentToClassroom(Long classroomId, Long studentId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + classroomId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("ไม่พบนักเรียน ID: " + studentId));
        student.setClassroom(classroom);
        studentRepository.save(student);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentDto> listStudentsByClassroom(Long classroomId) {
        return studentRepository.findByClassroomId(classroomId).stream()
                .map(s -> StudentDto.builder()
                        .id(s.getId())
                        .studentCode(s.getStudentCode())
                        .firstName(s.getFirstName())
                        .lastName(s.getLastName())
                        .gender(s.getGender() != null ? s.getGender().name() : null)
                        .classroomId(classroomId)
                        .isActive(s.isActive())
                        .status(s.getStatus())
                        .build())
                .collect(Collectors.toList());
    }

    // ==================== Subjects ====================

    @Override
    public SubjectDto createSubject(CreateSubjectRequest request) {
        if (subjectRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("รหัสวิชา " + request.getCode() + " มีอยู่แล้ว");
        }
        Subject subject = Subject.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .credits(request.getCredits() != null ? request.getCredits() : 1)
                .gradeLevel(request.getGradeLevel())
                .active(true)
                .build();
        return toSubjectDto(subjectRepository.save(subject));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectDto> listSubjects() {
        return subjectRepository.findAll().stream()
                .map(this::toSubjectDto)
                .collect(Collectors.toList());
    }

    @Override
    public SubjectDto updateSubject(Long id, CreateSubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายวิชา ID: " + id));
        // ตรวจสอบรหัสวิชาซ้ำ (ไม่รวมตัวเอง)
        if (request.getCode() != null && !request.getCode().equals(subject.getCode())
                && subjectRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("รหัสวิชา " + request.getCode() + " มีอยู่แล้ว");
        }
        if (request.getCode() != null) subject.setCode(request.getCode());
        if (request.getName() != null) subject.setName(request.getName());
        if (request.getDescription() != null) subject.setDescription(request.getDescription());
        if (request.getCredits() != null) subject.setCredits(request.getCredits());
        if (request.getGradeLevel() != null) subject.setGradeLevel(request.getGradeLevel());
        return toSubjectDto(subjectRepository.save(subject));
    }

    @Override
    public void deleteSubject(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายวิชา ID: " + id));
        // ตรวจสอบว่ามีการใช้งานในตารางสอนหรือไม่
        if (scheduleRepository.existsBySubjectId(id)) {
            throw new RuntimeException("ไม่สามารถลบรายวิชาได้ เนื่องจากมีการใช้งานรายวิชานี้ในตารางสอนแล้ว");
        }
        // ตรวจสอบว่ามีการใช้งานใน teacher_subject หรือไม่
        if (teacherSubjectRepository.existsBySubjectId(id)) {
            throw new RuntimeException("ไม่สามารถลบรายวิชาได้ เนื่องจากมีครูที่สอนวิชานี้อยู่");
        }
        subjectRepository.delete(subject);
    }

    @Override
    public void toggleSubjectStatus(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบรายวิชา ID: " + id));
        subject.setActive(!subject.getActive());
        subjectRepository.save(subject);
    }

    // ==================== TeacherSubject ====================

    @Override
    public TeacherSubjectDto createTeacherSubject(CreateTeacherSubjectRequest request) {
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("ไม่พบครู ID: " + request.getTeacherId()));
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("ไม่พบรายวิชา ID: " + request.getSubjectId()));
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + request.getClassroomId()));

        TeacherSubject ts = TeacherSubject.builder()
                .teacher(teacher)
                .subject(subject)
                .classroom(classroom)
                .academicYear(request.getAcademicYear() != null ? request.getAcademicYear() : "2568")
                .semester(request.getSemester() != null ? request.getSemester() : 1)
                .build();
        return toTeacherSubjectDto(teacherSubjectRepository.save(ts));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherSubjectDto> listTeacherSubjects() {
        return teacherSubjectRepository.findAll().stream()
                .map(this::toTeacherSubjectDto)
                .collect(Collectors.toList());
    }

    @Override
    public TeacherSubjectDto updateTeacherSubject(Long id, CreateTeacherSubjectRequest request) {
        TeacherSubject ts = teacherSubjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการสอน ID: " + id));
        if (request.getTeacherId() != null) {
            User teacher = userRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบครู ID: " + request.getTeacherId()));
            ts.setTeacher(teacher);
        }
        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบรายวิชา ID: " + request.getSubjectId()));
            ts.setSubject(subject);
        }
        if (request.getClassroomId() != null) {
            Classroom classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + request.getClassroomId()));
            ts.setClassroom(classroom);
        }
        if (request.getAcademicYear() != null) ts.setAcademicYear(request.getAcademicYear());
        if (request.getSemester() != null) ts.setSemester(request.getSemester());
        return toTeacherSubjectDto(teacherSubjectRepository.save(ts));
    }

    @Override
    public void deleteTeacherSubject(Long id) {
        TeacherSubject ts = teacherSubjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการสอน ID: " + id));
        teacherSubjectRepository.delete(ts);
    }

    // ==================== Schedules ====================

    private TeacherSubject getOrCreateTeacherSubject(Long teacherId, Long subjectId, Long classroomId, String academicYear, Integer semester) {
        return teacherSubjectRepository.findFirstByTeacherIdAndSubjectIdAndClassroomIdAndAcademicYearOrderByIdDesc(
                teacherId, subjectId, classroomId, academicYear)
                .orElseGet(() -> {
                    User teacher = userRepository.findById(teacherId)
                            .orElseThrow(() -> new RuntimeException("ไม่พบครู ID: " + teacherId));
                    Subject subject = subjectRepository.findById(subjectId)
                            .orElseThrow(() -> new RuntimeException("ไม่พบรายวิชา ID: " + subjectId));
                    Classroom classroom = classroomRepository.findById(classroomId)
                            .orElseThrow(() -> new RuntimeException("ไม่พบห้องเรียน ID: " + classroomId));
                    TeacherSubject ts = TeacherSubject.builder()
                            .teacher(teacher)
                            .subject(subject)
                            .classroom(classroom)
                            .academicYear(academicYear)
                            .semester(semester != null ? semester : 1)
                            .build();
                    return teacherSubjectRepository.save(ts);
                });
    }

    @Override
    public ScheduleDto createSchedule(CreateScheduleRequest request) {
        TeacherSubject ts = teacherSubjectRepository.findById(request.getTeacherSubjectId())
                .orElseThrow(() -> new RuntimeException("ไม่พบข้อมูลการสอน ID: " + request.getTeacherSubjectId()));

        Schedule.DayOfWeek dow = Schedule.DayOfWeek.valueOf(request.getDayOfWeek().toUpperCase());

        // ตรวจสอบห้องเรียนทับซ้อน
        scheduleRepository.findAll().stream()
                .filter(s -> s.getTeacherSubject().getClassroom().getId().equals(ts.getClassroom().getId())
                        && s.getDayOfWeek() == dow
                        && s.getAcademicYear().equals(ts.getAcademicYear())
                        && s.getSemester().equals(ts.getSemester())
                        && isTimeOverlapping(request.getStartTime(), request.getEndTime(), s.getStartTime(), s.getEndTime()))
                .findFirst()
                .ifPresent(conflict -> {
                    throw new RuntimeException("ห้องเรียน " + conflict.getTeacherSubject().getClassroom().getName()
                            + " มีตารางสอนวิชา " + conflict.getTeacherSubject().getSubject().getName()
                            + " เวลา " + conflict.getStartTime() + " - " + conflict.getEndTime() + " แล้ว (เวลาทับซ้อน)");
                });

        // ตรวจสอบครูผู้สอนทับซ้อน
        scheduleRepository.findAll().stream()
                .filter(s -> s.getTeacherSubject().getTeacher().getId().equals(ts.getTeacher().getId())
                        && s.getDayOfWeek() == dow
                        && s.getAcademicYear().equals(ts.getAcademicYear())
                        && s.getSemester().equals(ts.getSemester())
                        && isTimeOverlapping(request.getStartTime(), request.getEndTime(), s.getStartTime(), s.getEndTime()))
                .findFirst()
                .ifPresent(conflict -> {
                    throw new RuntimeException("ครู " + conflict.getTeacherSubject().getTeacher().getFirstName()
                            + " มีตารางสอนห้อง " + conflict.getTeacherSubject().getClassroom().getName()
                            + " เวลา " + conflict.getStartTime() + " - " + conflict.getEndTime() + " แล้ว (เวลาทับซ้อน)");
                });

        Schedule schedule = Schedule.builder()
                .teacherSubject(ts)
                .dayOfWeek(dow)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .academicYear(ts.getAcademicYear())
                .semester(ts.getSemester())
                .build();
        return toScheduleDto(scheduleRepository.save(schedule));
    }

    @Override
    public List<ScheduleDto> createBulkSchedules(List<CreateScheduleFullRequest> requests) {
        List<ScheduleDto> results = new ArrayList<>();
        List<Schedule> allExisting = scheduleRepository.findAll();

        for (CreateScheduleFullRequest req : requests) {
            String academicYear = req.getAcademicYear() != null ? req.getAcademicYear() : "2568";
            Integer semester = req.getSemester() != null ? req.getSemester() : 1;
            Schedule.DayOfWeek dow = Schedule.DayOfWeek.valueOf(req.getDayOfWeek().toUpperCase());

            // ตรวจสอบเวลาทับซ้อนห้องเรียน (startA < endB && endA > startB)
            allExisting.stream()
                    .filter(s -> s.getTeacherSubject().getClassroom().getId().equals(req.getClassroomId())
                            && s.getDayOfWeek() == dow
                            && s.getAcademicYear().equals(academicYear)
                            && s.getSemester().equals(semester)
                            && isTimeOverlapping(req.getStartTime(), req.getEndTime(), s.getStartTime(), s.getEndTime()))
                    .findFirst()
                    .ifPresent(conflict -> {
                        throw new RuntimeException("ห้องเรียน " + conflict.getTeacherSubject().getClassroom().getName()
                                + " มีตารางสอนวิชา " + conflict.getTeacherSubject().getSubject().getName()
                                + " เวลา " + conflict.getStartTime() + " - " + conflict.getEndTime() + " แล้ว (เวลาทับซ้อน)");
                    });

            // ตรวจสอบเวลาทับซ้อนครูผู้สอน
            allExisting.stream()
                    .filter(s -> s.getTeacherSubject().getTeacher().getId().equals(req.getTeacherId())
                            && s.getDayOfWeek() == dow
                            && s.getAcademicYear().equals(academicYear)
                            && s.getSemester().equals(semester)
                            && isTimeOverlapping(req.getStartTime(), req.getEndTime(), s.getStartTime(), s.getEndTime()))
                    .findFirst()
                    .ifPresent(conflict -> {
                        throw new RuntimeException("ครู " + conflict.getTeacherSubject().getTeacher().getFirstName()
                                + " มีตารางสอนห้อง " + conflict.getTeacherSubject().getClassroom().getName()
                                + " เวลา " + conflict.getStartTime() + " - " + conflict.getEndTime() + " แล้ว (เวลาทับซ้อน)");
                    });

            TeacherSubject ts = getOrCreateTeacherSubject(
                    req.getTeacherId(), req.getSubjectId(), req.getClassroomId(),
                    academicYear, semester);

            Schedule schedule = Schedule.builder()
                    .teacherSubject(ts)
                    .dayOfWeek(dow)
                    .startTime(req.getStartTime())
                    .endTime(req.getEndTime())
                    .academicYear(academicYear)
                    .semester(semester)
                    .build();
            Schedule saved = scheduleRepository.save(schedule);
            allExisting.add(saved);
            results.add(toScheduleDto(saved));
        }
        return results;
    }

    private boolean isTimeOverlapping(String startA, String endA, String startB, String endB) {
        if (startA == null || endA == null || startB == null || endB == null) return false;
        return startA.compareTo(endB) < 0 && endA.compareTo(startB) > 0;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleDto> listSchedules(Long teacherId) {
        List<Schedule> schedules;
        if (teacherId != null) {
            schedules = scheduleRepository.findByTeacherSubjectTeacherId(teacherId);
        } else {
            schedules = scheduleRepository.findAll();
        }
        return schedules.stream().map(this::toScheduleDto).collect(Collectors.toList());
    }

    @Override
    public ScheduleDto updateSchedule(Long id, CreateScheduleFullRequest request) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบตารางสอน ID: " + id));

        String newStart = request.getStartTime() != null ? request.getStartTime() : schedule.getStartTime();
        String newEnd = request.getEndTime() != null ? request.getEndTime() : schedule.getEndTime();
        Schedule.DayOfWeek newDow = request.getDayOfWeek() != null
                ? Schedule.DayOfWeek.valueOf(request.getDayOfWeek().toUpperCase())
                : schedule.getDayOfWeek();
        String academicYear = request.getAcademicYear() != null ? request.getAcademicYear() : schedule.getAcademicYear();
        Integer semester = request.getSemester() != null ? request.getSemester() : schedule.getSemester();
        Long newClassroomId = request.getClassroomId() != null ? request.getClassroomId() : schedule.getTeacherSubject().getClassroom().getId();
        Long newTeacherId = request.getTeacherId() != null ? request.getTeacherId() : schedule.getTeacherSubject().getTeacher().getId();

        // ตรวจสอบเวลาทับซ้อนห้องเรียน
        scheduleRepository.findAll().stream()
                .filter(s -> !s.getId().equals(id)
                        && s.getTeacherSubject().getClassroom().getId().equals(newClassroomId)
                        && s.getDayOfWeek() == newDow
                        && s.getAcademicYear().equals(academicYear)
                        && s.getSemester().equals(semester)
                        && isTimeOverlapping(newStart, newEnd, s.getStartTime(), s.getEndTime()))
                .findFirst()
                .ifPresent(conflict -> {
                    throw new RuntimeException("ห้องเรียน " + conflict.getTeacherSubject().getClassroom().getName()
                            + " มีตารางสอนวิชา " + conflict.getTeacherSubject().getSubject().getName()
                            + " เวลา " + conflict.getStartTime() + " - " + conflict.getEndTime() + " แล้ว (เวลาทับซ้อน)");
                });

        // ตรวจสอบเวลาทับซ้อนครูผู้สอน
        scheduleRepository.findAll().stream()
                .filter(s -> !s.getId().equals(id)
                        && s.getTeacherSubject().getTeacher().getId().equals(newTeacherId)
                        && s.getDayOfWeek() == newDow
                        && s.getAcademicYear().equals(academicYear)
                        && s.getSemester().equals(semester)
                        && isTimeOverlapping(newStart, newEnd, s.getStartTime(), s.getEndTime()))
                .findFirst()
                .ifPresent(conflict -> {
                    throw new RuntimeException("ครู " + conflict.getTeacherSubject().getTeacher().getFirstName()
                            + " มีตารางสอนห้อง " + conflict.getTeacherSubject().getClassroom().getName()
                            + " เวลา " + conflict.getStartTime() + " - " + conflict.getEndTime() + " แล้ว (เวลาทับซ้อน)");
                });

        if (request.getTeacherId() != null && request.getSubjectId() != null && request.getClassroomId() != null) {
            TeacherSubject ts = getOrCreateTeacherSubject(
                    request.getTeacherId(), request.getSubjectId(), request.getClassroomId(),
                    academicYear, semester);
            schedule.setTeacherSubject(ts);
            schedule.setAcademicYear(academicYear);
            schedule.setSemester(semester);
        }
        schedule.setDayOfWeek(newDow);
        schedule.setStartTime(newStart);
        schedule.setEndTime(newEnd);
        return toScheduleDto(scheduleRepository.save(schedule));
    }

    @Override
    public void deleteSchedule(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ไม่พบตารางสอน ID: " + id));
        scheduleRepository.delete(schedule);
    }

    // ==================== Report ====================

    @Override
    @Transactional(readOnly = true)
    public SystemReportDto getSystemReport(String year, Integer term) {
        long totalStudents = studentRepository.count();
        long totalTeachers = userRepository.findByRole(User.Role.TEACHER).size()
                + userRepository.findByRole(User.Role.HOMEROOM_TEACHER).size();
        long totalParents = userRepository.findByRole(User.Role.PARENT).size();
        long totalClassrooms = classroomRepository.count();
        long totalSubjects = subjectRepository.count();
        long totalAssignments = assignmentRepository.count();

        List<SubmissionStatus> allSubmissions = submissionStatusRepository.findAll();

        if (year != null && !year.equalsIgnoreCase("all")) {
            allSubmissions = allSubmissions.stream()
                    .filter(s -> {
                        TeacherSubject ts = s.getAssignment() != null ? s.getAssignment().getTeacherSubject() : null;
                        if (ts == null) return true;
                        String ay = ts.getAcademicYear();
                        if (ay == null || ay.isBlank()) ay = "2568";
                        return year.equals(ay);
                    })
                    .collect(Collectors.toList());
        }
        if (term != null && term > 0) {
            allSubmissions = allSubmissions.stream()
                    .filter(s -> {
                        TeacherSubject ts = s.getAssignment() != null ? s.getAssignment().getTeacherSubject() : null;
                        if (ts == null) return true;
                        Integer sem = ts.getSemester();
                        if (sem == null) return true;
                        return term.equals(sem);
                    })
                    .collect(Collectors.toList());
        }

        long totalSubStatus = allSubmissions.size();
        long submittedCount = allSubmissions.stream()
                .filter(s -> s.getStatus() == SubmissionStatus.Status.SUBMITTED || s.getStatus() == SubmissionStatus.Status.LATE_SUBMITTED)
                .count();
        long pendingGradingCount = allSubmissions.stream()
                .filter(s -> (s.getStatus() == SubmissionStatus.Status.SUBMITTED || s.getStatus() == SubmissionStatus.Status.LATE_SUBMITTED) && s.getScore() == null)
                .count();
        double avgSubmissionRate = totalSubStatus > 0 ? (double) submittedCount / totalSubStatus * 100 : 0.0;

        List<RecentActivityDto> recentActivities = allSubmissions.stream()
                .sorted(Comparator.comparing(SubmissionStatus::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                                  .thenComparing(SubmissionStatus::getId, Comparator.reverseOrder()))
                .limit(24)
                .map(s -> {
                    String statusStr = "pending";
                    String statusLabel = "ยังไม่ได้ส่ง";
                    String action = "ตรวจงาน";
                    String actionType = "primary";

                    if (s.getStatus() == SubmissionStatus.Status.SUBMITTED || s.getStatus() == SubmissionStatus.Status.LATE_SUBMITTED) {
                        statusStr = "submitted";
                        statusLabel = "ส่งแล้ว";
                        action = "ดูรายละเอียด";
                        actionType = "secondary";
                    } else if (s.getStatus() == SubmissionStatus.Status.NOT_SUBMITTED) {
                        if (s.getAssignment().getDueDate().isBefore(LocalDate.now())) {
                            statusStr = "overdue";
                            statusLabel = "เกินกำหนด";
                            action = "แจ้งเตือน";
                            actionType = "primary";
                        }
                    }

                    // Format date (convert LocalDate to string with thai month if possible, but keep simple for now)
                    String dateStr = s.getUpdatedAt() != null ? s.getUpdatedAt().toLocalDate().toString() : LocalDate.now().toString();

                    return RecentActivityDto.builder()
                            .id(s.getId())
                            .studentName(s.getStudent().getFullName())
                            .avatar("https://ui-avatars.com/api/?name=" + s.getStudent().getFirstName() + "&background=random")
                            .subject(s.getAssignment().getTeacherSubject().getSubject().getName())
                            .task(s.getAssignment().getTitle())
                            .status(statusStr)
                            .statusLabel(statusLabel)
                            .date(dateStr)
                            .action(action)
                            .actionType(actionType)
                            .build();
                })
                .collect(Collectors.toList());

        List<SubjectAchievementDto> subjectAchievements = new ArrayList<>();
        String[] colors = {"bg-blue-600", "bg-emerald-600", "bg-indigo-600", "bg-amber-600", "bg-rose-500", "bg-purple-600", "bg-teal-600", "bg-cyan-600"};

        Map<Long, List<SubmissionStatus>> subsBySubjectId = allSubmissions.stream()
                .filter(s -> s.getAssignment() != null
                        && s.getAssignment().getTeacherSubject() != null
                        && s.getAssignment().getTeacherSubject().getSubject() != null
                        && s.getAssignment().getTeacherSubject().getSubject().getId() != null)
                .collect(Collectors.groupingBy(s -> s.getAssignment().getTeacherSubject().getSubject().getId()));

        List<TeacherSubject> allTeacherSubjects = teacherSubjectRepository.findAll();
        if (year != null && !year.equalsIgnoreCase("all")) {
            allTeacherSubjects = allTeacherSubjects.stream()
                    .filter(ts -> {
                        String ay = ts.getAcademicYear();
                        if (ay == null || ay.isBlank()) ay = "2568";
                        return year.equals(ay);
                    })
                    .collect(Collectors.toList());
        }
        if (term != null && term > 0) {
            allTeacherSubjects = allTeacherSubjects.stream()
                    .filter(ts -> {
                        Integer sem = ts.getSemester();
                        if (sem == null) return true;
                        return term.equals(sem);
                    })
                    .collect(Collectors.toList());
        }
        Map<Long, List<TeacherSubject>> tsBySubjectId = allTeacherSubjects.stream()
                .filter(ts -> ts.getSubject() != null && ts.getSubject().getId() != null)
                .collect(Collectors.groupingBy(ts -> ts.getSubject().getId()));

        List<Subject> allSubjects = subjectRepository.findAll();
        if (allSubjects.isEmpty()) {
            Map<Long, Subject> subjectMap = allSubmissions.stream()
                    .filter(s -> s.getAssignment() != null && s.getAssignment().getTeacherSubject() != null && s.getAssignment().getTeacherSubject().getSubject() != null)
                    .map(s -> s.getAssignment().getTeacherSubject().getSubject())
                    .distinct()
                    .collect(Collectors.toMap(Subject::getId, s -> s, (s1, s2) -> s1));
            allSubjects = new ArrayList<>(subjectMap.values());
        }

        int colorIdx = 0;
        for (Subject sub : allSubjects) {
            if (sub.getActive() != null && !sub.getActive()) {
                continue;
            }

            List<SubmissionStatus> subs = subsBySubjectId.getOrDefault(sub.getId(), Collections.emptyList());
            List<TeacherSubject> tsList = tsBySubjectId.getOrDefault(sub.getId(), Collections.emptyList());

            String classroomName = subs.stream()
                    .map(s -> s.getAssignment() != null && s.getAssignment().getTeacherSubject() != null && s.getAssignment().getTeacherSubject().getClassroom() != null
                            ? s.getAssignment().getTeacherSubject().getClassroom().getName() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.joining(", "));

            if (classroomName.isBlank() && !tsList.isEmpty()) {
                classroomName = tsList.stream()
                        .map(ts -> ts.getClassroom() != null ? ts.getClassroom().getName() : null)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.joining(", "));
            }

            Integer gLevel = sub.getGradeLevel();
            if (gLevel == null && !tsList.isEmpty()) {
                for (TeacherSubject ts : tsList) {
                    if (ts.getClassroom() != null && ts.getClassroom().getGradeLevel() != null) {
                        gLevel = ts.getClassroom().getGradeLevel();
                        break;
                    }
                }
            }

            String gradeLabel = getGradeLabel(gLevel, classroomName, sub.getName());
            Integer finalGradeLevel = parseGradeLevel(gLevel, gradeLabel);

            long subAssignments = subs.stream()
                    .map(s -> s.getAssignment() != null ? s.getAssignment().getId() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
            if (subAssignments == 0 && !tsList.isEmpty()) {
                subAssignments = tsList.stream()
                        .filter(ts -> ts.getAssignments() != null)
                        .mapToLong(ts -> ts.getAssignments().size())
                        .sum();
            }

            long subDoneCount = subs.stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.Status.SUBMITTED || s.getStatus() == SubmissionStatus.Status.LATE_SUBMITTED)
                    .count();

            int percent = subs.isEmpty() ? 0 : (int) Math.round((double) subDoneCount / subs.size() * 100);

            subjectAchievements.add(SubjectAchievementDto.builder()
                    .id(sub.getId())
                    .subject(sub.getName())
                    .subjectCode(sub.getCode())
                    .gradeLevel(finalGradeLevel)
                    .gradeName(gradeLabel)
                    .classroomName(classroomName.isBlank() ? gradeLabel : classroomName)
                    .totalAssignments((int) subAssignments)
                    .submittedCount((int) subDoneCount)
                    .totalSubmissions(subs.size())
                    .percent(percent)
                    .color(colors[colorIdx % colors.length])
                    .build());
            colorIdx++;
        }

        subjectAchievements.sort((a, b) -> {
            int gradeCompare = Integer.compare(
                    a.getGradeLevel() != null ? a.getGradeLevel() : 99,
                    b.getGradeLevel() != null ? b.getGradeLevel() : 99
            );
            if (gradeCompare != 0) return gradeCompare;
            return a.getSubject().compareTo(b.getSubject());
        });

        Set<String> yearSet = new HashSet<>();
        classroomRepository.findAll().forEach(c -> { if (c.getAcademicYear() != null && !c.getAcademicYear().isBlank()) yearSet.add(c.getAcademicYear()); });
        teacherSubjectRepository.findAll().forEach(ts -> { if (ts.getAcademicYear() != null && !ts.getAcademicYear().isBlank()) yearSet.add(ts.getAcademicYear()); });
        if (yearSet.isEmpty()) {
            yearSet.add("2568");
            yearSet.add("2567");
        }
        List<String> availableYears = new ArrayList<>(yearSet);
        Collections.sort(availableYears, Collections.reverseOrder());

        return SystemReportDto.builder()
                .totalStudents((int) totalStudents)
                .totalTeachers((int) totalTeachers)
                .totalParents((int) totalParents)
                .totalClassrooms((int) totalClassrooms)
                .totalSubjects((int) totalSubjects)
                .totalAssignments((int) totalAssignments)
                .totalSubmitted((int) submittedCount)
                .pendingGrading((int) pendingGradingCount)
                .avgSubmissionRate(avgSubmissionRate)
                .avgAttendanceRate(0.0)
                .recentActivities(recentActivities)
                .subjectAchievements(subjectAchievements)
                .availableYears(availableYears)
                .build();
    }

    // ==================== Helpers ====================

    private String getGradeLabel(Integer gradeLevel, String classroomName, String subjectName) {
        if (classroomName != null && !classroomName.isBlank()) {
            if (classroomName.startsWith("ป.") || classroomName.startsWith("ม.")) {
                int slashIdx = classroomName.indexOf('/');
                if (slashIdx > 0) {
                    return classroomName.substring(0, slashIdx);
                }
                return classroomName;
            }
        }
        if (subjectName != null && !subjectName.isBlank()) {
            if (subjectName.contains("ป.1")) return "ป.1";
            if (subjectName.contains("ป.2")) return "ป.2";
            if (subjectName.contains("ป.3")) return "ป.3";
            if (subjectName.contains("ป.4")) return "ป.4";
            if (subjectName.contains("ป.5")) return "ป.5";
            if (subjectName.contains("ป.6")) return "ป.6";
            if (subjectName.contains("ม.1")) return "ม.1";
            if (subjectName.contains("ม.2")) return "ม.2";
            if (subjectName.contains("ม.3")) return "ม.3";
        }
        if (gradeLevel != null && gradeLevel > 0) {
            if (gradeLevel <= 6) return "ป." + gradeLevel;
            if (gradeLevel <= 9) return "ม." + (gradeLevel - 6);
            return "ชั้น " + gradeLevel;
        }
        return "ทั่วไป";
    }

    private Integer parseGradeLevel(Integer gradeLevel, String gradeLabel) {
        if (gradeLevel != null && gradeLevel > 0) return gradeLevel;
        if (gradeLabel != null) {
            if (gradeLabel.startsWith("ป.")) {
                try {
                    return Integer.parseInt(gradeLabel.substring(2));
                } catch (NumberFormatException ignored) {}
            } else if (gradeLabel.startsWith("ม.")) {
                try {
                    return Integer.parseInt(gradeLabel.substring(2)) + 6;
                } catch (NumberFormatException ignored) {}
            }
        }
        return 99;
    }

    private UserDto toUserDto(User user) {
        String classroomName = null;
        Integer gradeLevel = null;
        String roomNumber = null;
        Long classroomId = null;

        if (user.getRole() == User.Role.HOMEROOM_TEACHER) {
            List<Classroom> crList = classroomRepository.findByHomeroomTeacherUsername(user.getUsername());
            if (!crList.isEmpty()) {
                classroomName = crList.stream().map(Classroom::getName).distinct().collect(Collectors.joining(", "));
                gradeLevel = crList.get(0).getGradeLevel();
                roomNumber = crList.get(0).getRoomNumber();
                classroomId = crList.get(0).getId();
            }
        } else if (user.getRole() == User.Role.PARENT) {
            List<ParentStudent> psList = parentStudentRepository.findByParentId(user.getId());
            if (!psList.isEmpty()) {
                List<String> crNames = psList.stream()
                        .map(ParentStudent::getStudent)
                        .filter(s -> s != null && s.getClassroom() != null)
                        .map(s -> s.getClassroom().getName())
                        .distinct()
                        .collect(Collectors.toList());
                if (!crNames.isEmpty()) {
                    classroomName = String.join(", ", crNames);
                }
            }
        }

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .classroom(classroomName)
                .gradeLevel(gradeLevel)
                .roomNumber(roomNumber)
                .phone(user.getPhone())
                .isActive(user.isActive())
                .status(user.isActive() ? "ACTIVE" : "SUSPENDED")
                .lastLogin(user.getLastLogin())
                .lastPasswordChange(user.getLastPasswordChange() != null ? user.getLastPasswordChange() : user.getCreatedAt())
                .classroomId(classroomId)
                .build();
    }

    private TeacherSubjectDto toTeacherSubjectDto(TeacherSubject ts) {
        return TeacherSubjectDto.builder()
                .id(ts.getId())
                .teacherId(ts.getTeacher().getId())
                .teacherName(ts.getTeacher().getFullName())
                .subjectId(ts.getSubject().getId())
                .subjectName(ts.getSubject().getName())
                .subjectCode(ts.getSubject().getCode())
                .classroomId(ts.getClassroom().getId())
                .classroomName(ts.getClassroom().getName())
                .academicYear(ts.getAcademicYear())
                .semester(ts.getSemester())
                .build();
    }

    private ScheduleDto toScheduleDto(Schedule s) {
        TeacherSubject ts = s.getTeacherSubject();
        return ScheduleDto.builder()
                .id(s.getId())
                .teacherSubjectId(ts.getId())
                .teacherName(ts.getTeacher().getFullName())
                .subjectName(ts.getSubject().getName())
                .subjectCode(ts.getSubject().getCode())
                .classroomName(ts.getClassroom().getName())
                .dayOfWeek(s.getDayOfWeek().name())
                .dayOfWeekTh(dayOfWeekToThai(s.getDayOfWeek()))
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .academicYear(s.getAcademicYear())
                .semester(s.getSemester())
                .build();
    }

    private String dayOfWeekToThai(Schedule.DayOfWeek day) {
        if (day == null) return "";
        return switch (day) {
            case MONDAY -> "วันจันทร์";
            case TUESDAY -> "วันอังคาร";
            case WEDNESDAY -> "วันพุธ";
            case THURSDAY -> "วันพฤหัสบดี";
            case FRIDAY -> "วันศุกร์";
        };
    }

    private SubjectDto toSubjectDto(Subject s) {
        return SubjectDto.builder()
                .id(s.getId())
                .code(s.getCode())
                .name(s.getName())
                .description(s.getDescription())
                .credits(s.getCredits())
                .gradeLevel(s.getGradeLevel())
                .active(s.getActive())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private ClassroomDto toClassroomDto(Classroom c) {
        return ClassroomDto.builder()
                .id(c.getId())
                .name(c.getName())
                .gradeLevel(c.getGradeLevel())
                .roomNumber(c.getRoomNumber())
                .maxStudents(c.getMaxStudents() != null ? c.getMaxStudents() : 30)
                .academicYear(c.getAcademicYear())
                .homeroomTeacherId(c.getHomeroomTeacher() != null ? c.getHomeroomTeacher().getId() : null)
                .homeroomTeacherName(c.getHomeroomTeacher() != null ? c.getHomeroomTeacher().getFullName() : null)
                .studentCount(c.getStudents() != null ? c.getStudents().size() : 0)
                .build();
    }

    private LocalDate parseFlexibleDate(String dobStr) {
        if (dobStr == null || dobStr.trim().isEmpty()) return null;
        String clean = dobStr.trim();

        // 1. Convert Thai numerals to Arabic digits
        char[] thai = {'๐','๑','๒','๓','๔','๕','๖','๗','๘','๙'};
        StringBuilder sb = new StringBuilder(clean.length());
        for (char c : clean.toCharArray()) {
            boolean matched = false;
            for (int i = 0; i < thai.length; i++) {
                if (c == thai[i]) {
                    sb.append((char) ('0' + i));
                    matched = true;
                    break;
                }
            }
            if (!matched) sb.append(c);
        }
        clean = sb.toString();

        // 2. Remove time component if present
        clean = clean.replaceAll("[T\\s]\\d{1,2}:\\d{1,2}(:\\d{1,2})?.*$", "").trim();

        // 3. Excel numeric serial date (e.g. 42170 or 42170.0)
        try {
            double num = Double.parseDouble(clean);
            if (num > 1000 && num < 100000) {
                Date d = DateUtil.getJavaDate(num);
                if (d != null) {
                    return d.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
                }
            }
        } catch (NumberFormatException ignored) {}

        // 4. Thai month names
        String[][] thaiMonths = {
                {"มกราคม", "ม.ค.", "ม.ค", "1"},
                {"กุมภาพันธ์", "ก.พ.", "ก.พ", "2"},
                {"มีนาคม", "มี.ค.", "มี.ค", "3"},
                {"เมษายน", "เม.ย.", "เม.ย", "4"},
                {"พฤษภาคม", "พ.ค.", "พ.ค", "5"},
                {"มิถุนายน", "มิ.ย.", "มิ.ย", "6"},
                {"กรกฎาคม", "ก.ค.", "ก.ค", "7"},
                {"สิงหาคม", "ส.ค.", "ส.ค", "8"},
                {"กันยายน", "ก.ย.", "ก.ย", "9"},
                {"ตุลาคม", "ต.ค.", "ต.ค", "10"},
                {"พฤศจิกายน", "พ.ย.", "พ.ย", "11"},
                {"ธันวาคม", "ธ.ค.", "ธ.ค", "12"}
        };
        for (String[] entry : thaiMonths) {
            for (int i = 0; i < entry.length - 1; i++) {
                String mName = entry[i];
                if (clean.contains(mName)) {
                    int month = Integer.parseInt(entry[entry.length - 1]);
                    String stripped = clean.replace(mName, " ").trim();
                    String[] parts = stripped.split("[\\s\\-/.+]+");
                    if (parts.length >= 2) {
                        try {
                            int day = Integer.parseInt(parts[0]);
                            int year = Integer.parseInt(parts[1]);
                            if (year >= 40 && year <= 99) year += 2500;
                            if (year > 2400) year -= 543;
                            if (year < 100) year += 2000;
                            return LocalDate.of(year, month, day);
                        } catch (Exception ignored) {}
                    }
                }
            }
        }

        // 5. Standard date patterns
        String[] patterns = {
                "yyyy-MM-dd", "yyyy/MM/dd", "yyyy.MM.dd",
                "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "d-M-yyyy", "dd.MM.yyyy", "d.M.yyyy",
                "MM/dd/yyyy", "M/d/yyyy"
        };
        for (String pattern : patterns) {
            try {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern(pattern);
                LocalDate date = LocalDate.parse(clean, formatter);
                if (date.getYear() > 2400) {
                    date = date.minusYears(543);
                }
                return date;
            } catch (Exception ignored) {}
        }

        // 6. 2-digit year (e.g. "15/06/58" or "15-6-58")
        java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{2})$").matcher(clean);
        if (m2.matches()) {
            try {
                int day = Integer.parseInt(m2.group(1));
                int month = Integer.parseInt(m2.group(2));
                int rawYear = Integer.parseInt(m2.group(3));
                int year = rawYear >= 40 ? rawYear + 2500 - 543 : rawYear + 2000;
                return LocalDate.of(year, month, day);
            } catch (Exception ignored) {}
        }

        // 7. Compact 8-digit format (e.g. "20150615" or "25580615")
        if (clean.matches("^\\d{8}$")) {
            try {
                int year = Integer.parseInt(clean.substring(0, 4));
                int month = Integer.parseInt(clean.substring(4, 6));
                int day = Integer.parseInt(clean.substring(6, 8));
                if (year > 2400) year -= 543;
                return LocalDate.of(year, month, day);
            } catch (Exception ignored) {}
        }

        return null;
    }

    private String getCellString(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            try {
                Date date = cell.getDateCellValue();
                if (date != null) {
                    return new java.text.SimpleDateFormat("yyyy-MM-dd").format(date);
                }
            } catch (Exception ignored) {}
        }
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }
}
