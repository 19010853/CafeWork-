package cafework.controller;

import cafework.dto.request.LoginRequest;
import cafework.dto.request.RegisterRequest;
import cafework.dto.request.VerifyOtpRequest;
import cafework.dto.request.ForgotPasswordRequest;
import cafework.dto.request.ResetPasswordRequest;
import cafework.dto.request.ChangePasswordRequest;
import cafework.dto.response.AuthResponse;
import cafework.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    @Autowired
    private AuthService authService;

    // Temporary storage for register data between steps
    private final Map<String, RegisterRequest> pendingRegistrations = new HashMap<>();

    @PostMapping("/signup/initiate")
    public ResponseEntity<?> initiateSignup(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.initiateRegistration(request);
            pendingRegistrations.put(request.getEmail(), request);
            return ResponseEntity.ok("OTP sent to your email.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<?> verifySignup(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            RegisterRequest registerData = pendingRegistrations.get(request.getEmail());
            if (registerData == null) {
                return ResponseEntity.badRequest().body("No pending registration found for this email.");
            }
            AuthResponse response = authService.verifyAndRegister(request, registerData);
            pendingRegistrations.remove(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    // --- Cập nhật Sprint 4: Reset Password ---

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.processForgotPassword(request.getEmail());
            return ResponseEntity.ok("Mã OTP đã được gửi đến email của bạn.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            authService.verifyOtp(request);
            return ResponseEntity.ok("OTP hợp lệ.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok("Đặt lại mật khẩu thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // --- Cập nhật Sprint 4: Change Password ---

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            authService.changePassword(email, request);
            return ResponseEntity.ok("Đổi mật khẩu thành công");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Có lỗi xảy ra: " + e.getMessage());
        }
    }
}
