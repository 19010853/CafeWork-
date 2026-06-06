package cafework.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID; // Thần thêm thư viện này để xử lý ID của bá tánh

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import cafework.model.User;
import cafework.model.Review;
import cafework.repository.ReviewRepository;
import cafework.repository.UserRepository;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Review> getAllReviews() {
        List<Review> reviews = reviewRepository.findAll();
        
        // CHIÊU KIẾM MỚI: Tự động lùng sục tên bá tánh cho toàn bộ tấu chương
        for (Review r : reviews) {
            enrichReviewWithUserName(r);
        }
        return reviews;
    }

    @GetMapping("/{id}")
    public Review getReviewById(@PathVariable String id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review != null) {
            // Đắp tên vào cho cả trường hợp lấy 1 tấu chương
            enrichReviewWithUserName(review);
        }
        return review;
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review requestReview) {
        try {
            // 1. Lấy Thẻ bài đang được Cấm Vệ Quân giữ trên tay
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentUserEmail = authentication.getName();

            // 2. Tra sổ Nam Tào
            User currentUser = userRepository.findByEmail(currentUserEmail)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

            // 3. ĐÓNG DẤU CHỦ QUYỀN
            requestReview.setUserId(currentUser.getId().toString()); 
            requestReview.setUserName(currentUser.getFullName()); // Biến này sẽ bị Hibernate bơ đi khi lưu
            requestReview.setCreatedAt(LocalDateTime.now());
            
            // 4. Nộp tấu chương vào kho
            Review savedReview = reviewRepository.save(requestReview);
            
            // Do Hibernate có thể trả về object mới bị mất biến Transient, thần đóng dấu lại lần nữa cho chắc
            savedReview.setUserName(currentUser.getFullName());
            
            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Review updateReview(@PathVariable String id, @RequestBody Review review) {
        review.setId(id);
        return reviewRepository.save(review);
    }

    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable String id) {
        reviewRepository.deleteById(id);
    }

    // --- CÔNG CỤ HỖ TRỢ BÍ MẬT ---
    // Hàm này giúp mã nguồn của ngài gọn gàng hơn, không bị lặp lại
    private void enrichReviewWithUserName(Review r) {
        if (r.getUserId() != null) {
            try {
                UUID userUuid = UUID.fromString(r.getUserId());
                userRepository.findById(userUuid).ifPresent(user -> {
                    r.setUserName(user.getFullName());
                });
            } catch (Exception e) {
                // Nếu ID rỗng hoặc sai chuẩn UUID
                r.setUserName("匿名ユーザー");
            }
        } else {
            r.setUserName("匿名ユーザー");
        }
    }
}
