package com.school;

import com.school.entity.Subject;
import com.school.entity.User;
import com.school.repository.SubjectRepository;
import com.school.repository.TeacherSubjectRepository;
import com.school.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherSubjectRepository teacherSubjectRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository,
                           SubjectRepository subjectRepository,
                           TeacherSubjectRepository teacherSubjectRepository,
                           PasswordEncoder passwordEncoder,
                           JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.teacherSubjectRepository = teacherSubjectRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // ลบคอลัมน์ email ออกจากตาราง users หากยังมีอยู่
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN email");
        } catch (Exception e) {
            // ละเว้นหากคอลัมน์ถูกลบไปแล้ว
        }

        // สร้าง Admin
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("123456"))
                .firstName("ผู้ดูแลระบบ")
                .lastName("สูงสุด")
                .role(User.Role.ADMIN)
                .isActive(true)
                .build();
            userRepository.save(admin);
        }

        // สร้าง/ปรับปรุงรายวิชา ป.1-ป.6
        initSubjects();
    }

    private void initSubjects() {
        // 22 รายวิชาตามหลักสูตร
        String[][] subjectData = {
            // { codePrefix, name, description, credits }
            { "TH", "ภาษาไทย", "กลุ่มสาระการเรียนรู้ภาษาไทย", "2" },
            { "MA", "คณิตศาสตร์", "กลุ่มสาระการเรียนรู้คณิตศาสตร์", "2" },
            { "SC", "วิทยาศาสตร์", "กลุ่มสาระการเรียนรู้วิทยาศาสตร์", "2" },
            { "CS", "วิทยาการคำนวณ", "การคิดเชิงคำนวณและเทคโนโลยีสารสนเทศ", "1" },
            { "EN", "ภาษาอังกฤษ", "กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ (ภาษาอังกฤษพื้นฐาน)", "2" },
            { "ENRW", "ภาษาอังกฤษ อ่าน-เขียน", "วิชาภาษาอังกฤษเพิ่มเติม ทักษะการอ่านและการเขียน", "1" },
            { "ENC", "ภาษาอังกฤษเพื่อการสื่อสาร", "วิชาภาษาอังกฤษเพิ่มเติม ทักษะการฟังและการพูดเพื่อการสื่อสาร", "1" },
            { "SO", "สังคมศึกษา", "กลุ่มสาระการเรียนรู้สังคมศึกษา ศาสนา และวัฒนธรรม", "1" },
            { "HI", "ประวัติศาสตร์", "ประวัติศาสตร์ไทยและประวัติศาสตร์สากล", "1" },
            { "HP", "สุขศึกษาพลศึกษา", "กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา", "1" },
            { "AR", "ศิลปะ", "กลุ่มสาระการเรียนรู้ศิลปะ ทัศนศิลป์ ดนตรี และนาฏศิลป์", "1" },
            { "WO", "การงานอาชีพฯ", "กลุ่มสาระการเรียนรู้การงานอาชีพ", "1" },
            { "AC", "ต้านทุจริต", "หลักสูตรต้านทุจริตศึกษา สร้างจิตสำนึกความซื่อสัตย์สุจริต", "1" },
            { "STEM", "สะเต็มศึกษา", "การจัดการเรียนรู้แบบบูรณาการ สะเต็มศึกษา (STEM Education)", "1" },
            { "TS", "ทักษะการคิด", "การพัฒนาทักษะกระบวนการคิด การคิดวิเคราะห์และการคิดสร้างสรรค์", "1" },
            { "ST", "วิทยาศาสตร์-พลังสิบ", "โครงการพัฒนาอัจฉริยภาพทางวิทยาศาสตร์และคณิตศาสตร์ (พลังสิบ)", "1" },
            { "LS", "Lap Science", "ปฏิบัติการทางวิทยาศาสตร์ การทดลอง และการสืบเสาะหาความรู้", "1" },
            { "GU", "แนะแนว", "กิจกรรมพัฒนาผู้เรียน ด้านการแนะแนวการศึกษา อาชีพ และชีวิต", "1" },
            { "BS", "ลูกเสือ", "กิจกรรมลูกเสือ-เนตรนารี ปลูกฝังระเบียบวินัยและความเสียสละ", "1" },
            { "CL", "ชุมนุม", "กิจกรรมชุมนุมตามความสนใจและความถนัดของผู้เรียน", "1" },
            { "RE", "ซ่อมเสริม", "กิจกรรมการเรียนรู้ซ่อมเสริมเพื่อพัฒนาศักยภาพผู้เรียน", "1" },
            { "RES", "ซ่อมเสริม(วิทย์)", "กิจกรรมการเรียนรู้ซ่อมเสริมด้านวิทยาศาสตร์", "1" }
        };

        // ล้าง/ปรับปรุงรายวิชาเดิม (จากระบบเริ่มต้น 8 วิชาเดิม) ที่ไม่ได้ใช้งาน
        for (int grade = 1; grade <= 6; grade++) {
            String[] oldOrphanCodes = {
                "SO" + grade + "04",
                "HE" + grade + "05",
                "AR" + grade + "06",
                "WO" + grade + "07",
                "EN" + grade + "08"
            };
            for (String oldCode : oldOrphanCodes) {
                subjectRepository.findByCode(oldCode).ifPresent(oldSub -> {
                    if (!teacherSubjectRepository.existsBySubjectId(oldSub.getId())) {
                        subjectRepository.delete(oldSub);
                    } else {
                        oldSub.setActive(false);
                        subjectRepository.save(oldSub);
                    }
                });
            }
        }

        // เพิ่มหรืออัปเดต 22 รายวิชาสำหรับ ป.1 ถึง ป.6
        for (int grade = 1; grade <= 6; grade++) {
            for (int i = 0; i < subjectData.length; i++) {
                String prefix = subjectData[i][0];
                String baseName = subjectData[i][1];
                String description = subjectData[i][2];
                int credit = Integer.parseInt(subjectData[i][3]);

                String code = String.format("%s%d%02d", prefix, grade, i + 1);
                String fullName = baseName + " ป." + grade;

                Optional<Subject> existing = subjectRepository.findByCode(code);
                if (existing.isPresent()) {
                    Subject subject = existing.get();
                    subject.setName(fullName);
                    subject.setDescription(description);
                    subject.setCredits(credit);
                    subject.setGradeLevel(grade);
                    subject.setActive(true);
                    subjectRepository.save(subject);
                } else {
                    Subject subject = Subject.builder()
                        .code(code)
                        .name(fullName)
                        .description(description)
                        .credits(credit)
                        .gradeLevel(grade)
                        .active(true)
                        .build();
                    subjectRepository.save(subject);
                }
            }
        }
    }
}
