package cafework.service.impl;

import cafework.dto.request.LoginRequest;
import cafework.dto.request.RegisterRequest;
import cafework.dto.request.VerifyOtpRequest;
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
}
