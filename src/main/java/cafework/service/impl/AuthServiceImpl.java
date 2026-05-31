package cafework.service.impl;

import cafework.dto.request.LoginRequest;
import cafework.dto.request.RegisterRequest;
import cafework.dto.request.VerifyOtpRequest;
import cafework.dto.request.ResetPasswordRequest;
import cafework.dto.request.ChangePasswordRequest;
import cafework.dto.response.AuthResponse;
import cafework.model.Cafe;
import cafework.model.Otp;
import cafework.model.User;
import cafework.repository.OtpRepository;
import cafework.repository.UserRepository;
import cafework.security.JwtUtil;
import cafework.service.AuthService;
import cafework.util.EmailUtil;
import cafework.util.OtpUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import cafework.repository.CafeRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private OtpUtil otpUtil;

    @Autowired
    private EmailUtil emailUtil;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CafeRepository cafeRepository;

    @Override
    public void initiateRegistration(RegisterRequest request) throws Exception {
        // 1. Check if user already exists
        if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent()) {
            throw new Exception("Email already registered!");
        }

        // 2. Generate OTP
        String code = otpUtil.generateOtp();

        // 3. Save OTP to DB
        Otp otp = Otp.builder()
                .email(request.getEmail())
                .otpCode(code)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .build();
        otpRepository.save(otp);

        // 4. Send Real Email
        emailUtil.sendOtpEmail(request.getEmail(), code);
    }

    @Override
    public AuthResponse verifyAndRegister(VerifyOtpRequest request, RegisterRequest registerData) throws Exception {
        // 1. Verify OTP
        Optional<Otp> otpOpt = otpRepository.findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
                request.getEmail(), request.getOtpCode(), LocalDateTime.now());

        if (otpOpt.isEmpty()) {
            throw new Exception("Invalid or expired OTP!");
        }

        // 2. Mark OTP as used
        Otp otp = otpOpt.get();
        otp.setUsed(true);
        otpRepository.save(otp);

        // 3. Save User (Plain-text password)
        User.Role role = User.Role.USER;
        if (registerData.getRole() != null) {
            try {
                role = User.Role.valueOf(registerData.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        User user = User.builder()
                .email(registerData.getEmail())
                .password(registerData.getPassword()) // Plain text as requested
                .fullName(registerData.getFullName())
                .role(role)
                .build();
        
        user = userRepository.save(user);

        // 4. Generate Token and return response
        String token = jwtUtil.generateToken(user.getEmail());
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) throws Exception {
        System.out.println("Email nhận được: " + request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new Exception("User not found!"));

        System.out.println("Mật khẩu trong DB: " + user.getPassword());
        System.out.println("Mật khẩu từ Client: " + request.getPassword());

        // Plain text comparison with trim
        if (!request.getPassword().trim().equals(user.getPassword().trim())) {
            throw new Exception("Invalid password!");
        }

        System.out.println("Login thành công cho user: " + user.getEmail());
        String token = jwtUtil.generateToken(user.getEmail());

        UUID myCafeId = null;
        if (user.getRole() == User.Role.OWNER) {
            Optional<Cafe> cafeOpt = cafeRepository.findByOwnerId(user.getId());
            if (cafeOpt.isPresent()) {
                myCafeId = cafeOpt.get().getId();
            }
        }
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .cafeId(myCafeId) // Trả về ID quán cà phê nếu người dùng là chủ quán
                .build();
    }

    // --- Cập nhật Sprint 4: Reset Password ---

    @Override
    public void processForgotPassword(String email) throws Exception {
        // 1. Kiểm tra email tồn tại
        userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new Exception("Email không tồn tại"));

        // 2. Sinh mã OTP
        String code = otpUtil.generateOtp();

        // 3. Lưu OTP (thời hạn 2 phút)
        Otp otp = Otp.builder()
                .email(email)
                .otpCode(code)
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .isUsed(false)
                .build();
        otpRepository.save(otp);

        // 4. Gửi email
        emailUtil.sendOtpEmail(email, code);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) throws Exception {
        // 1. Kiểm tra OTP hợp lệ
        Otp otp = otpRepository.findByEmailAndOtpCodeAndIsUsedFalseAndExpiresAtAfter(
                request.getEmail(), request.getOtpCode(), LocalDateTime.now())
                .orElseThrow(() -> new Exception("Mã OTP không hợp lệ hoặc đã hết hạn"));

        // 2. Validate mật khẩu mới (ít nhất 8 ký tự, 1 chữ hoa, 1 chữ số hoặc ký tự đặc biệt)
        String newPassword = request.getNewPassword();
        if (newPassword == null || !newPassword.matches("^(?=.*[A-Z])(?=.*[\\d!@#$%^&*])(?=.{8,}).*$")) {
            throw new IllegalArgumentException("Mật khẩu phải tối thiểu 8 ký tự, gồm chữ hoa và số/ký tự đặc biệt");
        }

        // 3. Cập nhật mật khẩu User
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new Exception("Người dùng không tồn tại"));
        
        user.setPassword(newPassword); // Plain text theo thiết kế hiện tại của dự án
        userRepository.save(user);

        // 4. Đánh dấu OTP đã sử dụng
        otp.setUsed(true);
        otpRepository.save(otp);
    }

    // --- Cập nhật Sprint 4: Change Password ---

    @Override
    public void changePassword(String email, ChangePasswordRequest request) throws Exception {
        // 1. Lấy User từ DB
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new Exception("Người dùng không tồn tại"));

        // 2. Kiểm tra mật khẩu hiện tại (So sánh Plain text)
        if (!request.getCurrentPassword().trim().equals(user.getPassword().trim())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không đúng");
        }

        // 3. Kiểm tra mật khẩu mới trùng cũ
        if (request.getNewPassword().trim().equals(user.getPassword().trim())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng mật khẩu cũ");
        }

        // 4. Validate mật khẩu mới
        String newPassword = request.getNewPassword();
        if (newPassword == null || !newPassword.matches("^(?=.*[A-Z])(?=.*[\\d!@#$%^&*])(?=.{8,}).*$")) {
            throw new IllegalArgumentException("Mật khẩu phải tối thiểu 8 ký tự, gồm chữ hoa và số/ký tự đặc biệt");
        }

        // 5. Cập nhật và lưu
        user.setPassword(newPassword);
        userRepository.save(user);
    }
}
