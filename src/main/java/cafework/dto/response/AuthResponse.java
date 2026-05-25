package cafework.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String token;
    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private UUID cafeId; // Thêm trường này để trả về ID quán cà phê nếu người dùng là chủ quán
}
