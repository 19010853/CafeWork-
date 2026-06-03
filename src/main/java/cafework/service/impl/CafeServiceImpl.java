package cafework.service.impl;
import cafework.dto.SeatStatusUpdateRequest;
import cafework.dto.SeatStatusUpdateResponse;
import cafework.dto.request.CafeRequest;
import cafework.model.Cafe;
import cafework.model.SearchHistory;
import cafework.model.User;
import cafework.repository.CafeRepository;
import cafework.repository.SearchHistoryRepository;
import cafework.repository.UserRepository;
import cafework.service.CafeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CafeServiceImpl implements CafeService {

    private static final List<String> VALID_SEAT_STATUSES = Arrays.asList(
            "AVAILABLE", "ALMOST_FULL", "FULL");

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<Cafe> searchByName(String keyword) {
        // 1. Lưu lịch sử tìm kiếm (Chỉ khi đã đăng nhập)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            try {
                String email = auth.getName();
                Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
                if (userOpt.isPresent()) {
                    SearchHistory history = new SearchHistory();
                    history.setUserId(userOpt.get().getId().toString());
                    history.setKeyword(keyword);
                    searchHistoryRepository.save(history);
                }
            } catch (Exception e) {
                System.err.println("Lỗi khi lưu lịch sử tìm kiếm: " + e.getMessage());
            }
        }

        // 2. Trả về kết quả tìm kiếm
        if (keyword == null || keyword.trim().isEmpty()) {
            return cafeRepository.findAll();
        }
        return cafeRepository.findByNameContainingIgnoreCase(keyword.trim());
    }

    @Override
    public Cafe getCafeDetailsById(UUID id) {
        return cafeRepository.findById(id).orElse(null);
    }

    @Override
    public SeatStatusUpdateResponse updateSeatStatus(UUID cafeId, SeatStatusUpdateRequest request) {
        String newStatus = request.getSeatStatus();
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("seatStatus không được để trống.");
        }
        if (!VALID_SEAT_STATUSES.contains(newStatus.toUpperCase())) {
            throw new IllegalArgumentException(
                    "seatStatus không hợp lệ: [" + newStatus + "]. " +
                            "Giá trị chấp nhận: AVAILABLE, ALMOST_FULL, FULL.");
        }

        Optional<Cafe> cafeOptional = cafeRepository.findById(cafeId);
        if (cafeOptional.isEmpty()) {
            return null;
        }

        Cafe cafe = cafeOptional.get();
        cafe.setSeatStatus(newStatus.toUpperCase());
        cafeRepository.save(cafe);

        return new SeatStatusUpdateResponse(
                cafe.getId().toString(),
                cafe.getName(),
                cafe.getSeatStatus(),
                "Trạng thái chỗ ngồi đã được cập nhật thành công.");
    }

    @Override
    public Cafe getCafeByOwnerId(UUID ownerId) {
        return cafeRepository.findByOwnerId(ownerId).orElse(null);
    }

    @Override
    public Cafe updateCafe(UUID ownerId, CafeRequest request) {
        // Validation
        validateCafeRequest(request);

        Cafe cafe = cafeRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quán của người dùng này."));

        cafe.setName(request.getName());
        cafe.setOwnerName(request.getOwnerName());
        cafe.setEmail(request.getEmail());
        cafe.setPhone(request.getPhone());
        cafe.setOpenHours(request.getOpenHours());
        cafe.setAddress(request.getAddress());
        cafe.setLatitude(request.getLatitude());
        cafe.setLongitude(request.getLongitude());
        cafe.setDescription(request.getDescription());

        return cafeRepository.save(cafe);
    }

    private void validateCafeRequest(CafeRequest request) {
        if (isBlank(request.getName())) throw new IllegalArgumentException("Tên quán không được để trống.");
        if (isBlank(request.getOwnerName())) throw new IllegalArgumentException("Tên chủ quán không được để trống.");
        if (isBlank(request.getEmail())) throw new IllegalArgumentException("Email không được để trống.");
        if (isBlank(request.getPhone())) throw new IllegalArgumentException("Số điện thoại không được để trống.");
        if (isBlank(request.getAddress())) throw new IllegalArgumentException("Địa chỉ không được để trống.");

        // Email format check
        String emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$";
        if (!Pattern.matches(emailRegex, request.getEmail())) {
            throw new IllegalArgumentException("Định dạng email không hợp lệ.");
        }

        // Phone: chỉ chứa số
        if (!Pattern.matches("^\\d+$", request.getPhone())) {
            throw new IllegalArgumentException("Định dạng số điện thoại không hợp lệ.");
        }

        // OpenHours: HH:MM format
        if (request.getOpenHours() == null || !Pattern.matches("^([0-1]?[0-9]|2[0-3]):[0-5][0-9] - ([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", request.getOpenHours().trim())) {
            throw new IllegalArgumentException("Định dạng giờ mở cửa không hợp lệ. Ví dụ: 08:00 - 22:00");
        }
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
    
    @Override
    public Cafe createCafe(UUID ownerId, CafeRequest request) {
        Cafe cafe = new Cafe();
        cafe.setId(UUID.randomUUID());
        cafe.setOwnerId(ownerId); // Gắn ID chủ quán làm khóa ngoại
        cafe.setName(request.getName());
        cafe.setOwnerName(request.getOwnerName());
        cafe.setEmail(request.getEmail());
        cafe.setPhone(request.getPhone());
        cafe.setOpenHours(request.getOpenHours());
        cafe.setAddress(request.getAddress());
        cafe.setLatitude(request.getLatitude());
        cafe.setLongitude(request.getLongitude());
        cafe.setDescription(request.getDescription());
        
        return cafeRepository.save(cafe); // Lưu sổ sách thành công!
    }
}
