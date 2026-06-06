package cafework.util;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class EmailUtil {

    private static final Logger log = LoggerFactory.getLogger(EmailUtil.class);

    @Autowired
    private JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Async
    public void sendOtpEmailAsync(String email, String code) {
        try {
            sendOtpEmail(email, code);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", email, e);
        }
    }

    public void sendOtpEmail(String email, String code) throws MessagingException {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
        
        if (fromAddress != null && !fromAddress.isBlank()) {
            helper.setFrom(fromAddress);
        }
        helper.setTo(email);
        helper.setSubject("カフェワーク - Mã xác thực OTP");
        
        String content = String.format("""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Xác thực tài khoản CafeWork</h2>
                <p>Mã OTP của bạn là: <b style="font-size: 24px; color: #5D4037;">%s</b></p>
                <p>Mã này sẽ hết hạn trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                <hr/>
                <p style="font-size: 12px; color: #888;">Đây là email tự động, vui lòng không trả lời.</p>
            </div>
            """, code);
            
        helper.setText(content, true);
        
        javaMailSender.send(mimeMessage);
    }
}
