package cafework.util;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class EmailUtil {

    private static final Logger log = LoggerFactory.getLogger(EmailUtil.class);
    private static final String BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private final RestClient restClient = RestClient.create();

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    @Value("${brevo.from-email:}")
    private String fromEmail;

    @Value("${brevo.from-name:CafeWork}")
    private String fromName;

    @Async
    public void sendOtpEmailAsync(String email, String code) {
        try {
            sendOtpEmail(email, code);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", email, e);
        }
    }

    public void sendOtpEmail(String email, String code) {
        validateBrevoConfig();

        Map<String, Object> payload = Map.of(
                "sender", Map.of(
                        "name", fromName,
                        "email", fromEmail),
                "to", List.of(Map.of("email", email)),
                "subject", "CafeWork - OTP verification code",
                "htmlContent", buildOtpEmailContent(code));

        try {
            ResponseEntity<String> response = restClient.post()
                    .uri(BREVO_EMAIL_ENDPOINT)
                    .header("api-key", brevoApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(String.class);

            log.info("Brevo accepted OTP email for {} with status {}", email, response.getStatusCode());
        } catch (RestClientResponseException e) {
            log.error(
                    "Brevo rejected OTP email for {} with status {} and body: {}",
                    email,
                    e.getStatusCode(),
                    e.getResponseBodyAsString(),
                    e);
            throw new IllegalStateException("Brevo failed to send OTP email: " + e.getStatusCode(), e);
        } catch (Exception e) {
            log.error("Failed to call Brevo OTP email API for {}", email, e);
            throw e;
        }
    }

    private void validateBrevoConfig() {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            throw new IllegalStateException("BREVO_API_KEY is not configured.");
        }
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("BREVO_FROM_EMAIL is not configured.");
        }
    }

    private String buildOtpEmailContent(String code) {
        return String.format("""
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>CafeWork account verification</h2>
                    <p>Your OTP code is: <b style="font-size: 24px; color: #5D4037;">%s</b></p>
                    <p>This code expires in 5 minutes. Do not share it with anyone.</p>
                    <hr/>
                    <p style="font-size: 12px; color: #888;">This is an automated email. Please do not reply.</p>
                </div>
                """, code);
    }
}
