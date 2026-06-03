package cafework.service;

import cafework.dto.request.LoginRequest;
import cafework.dto.request.RegisterRequest;
import cafework.dto.request.VerifyOtpRequest;
import cafework.dto.request.ForgotPasswordRequest;
import cafework.dto.request.ResetPasswordRequest;
import cafework.dto.request.ChangePasswordRequest;
import cafework.dto.response.AuthResponse;

public interface AuthService {
    void initiateRegistration(RegisterRequest request) throws Exception;
    AuthResponse verifyAndRegister(VerifyOtpRequest request, RegisterRequest registerData) throws Exception;
    AuthResponse login(LoginRequest request) throws Exception;
    
    // Thêm mới các phương thức cho luồng Reset Password
    void processForgotPassword(String email) throws Exception;
    void verifyOtp(VerifyOtpRequest request) throws Exception;
    void resetPassword(ResetPasswordRequest request) throws Exception;

    // Thêm mới phương thức cho luồng Change Password
    void changePassword(String email, ChangePasswordRequest request) throws Exception;
}
