package cafework.controller;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID; // Thần thêm thư viện này để xử lý ID của bá tánh

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public List<Review> getAllReviews(@RequestParam(required = false) String cafeId) {
        List<Review> reviews = (cafeId == null || cafeId.isBlank())
                ? reviewRepository.findAllByOrderByCreatedAtDesc()
                : reviewRepository.findByCafeIdOrderByCreatedAtDesc(cafeId);

        enrichReviewsWithUserNames(reviews);
        return reviews;
    }

    @GetMapping("/{id}")
    public Review getReviewById(@PathVariable String id) {
        Review review = reviewRepository.findById(id).orElse(null);
        if (review != null) {
            // Đắp tên vào cho cả trường hợp lấy 1 tấu chương
            enrichReviewsWithUserNames(List.of(review));
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
    public ResponseEntity<?> updateReview(@PathVariable String id, @RequestBody Review requestReview) {
        try {
            User currentUser = getCurrentUser();
            Review existingReview = reviewRepository.findById(id)
                    .orElse(null);

            if (existingReview == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found");
            }

            if (!currentUser.getId().toString().equals(existingReview.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only update your own review");
            }

            existingReview.setRating(requestReview.getRating());
            existingReview.setContent(requestReview.getContent());
            existingReview.setLanguage(requestReview.getLanguage());

            Review savedReview = reviewRepository.save(existingReview);
            savedReview.setUserName(currentUser.getFullName());

            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable String id) {
        try {
            User currentUser = getCurrentUser();
            Review existingReview = reviewRepository.findById(id)
                    .orElse(null);

            if (existingReview == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found");
            }

            if (!currentUser.getId().toString().equals(existingReview.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only delete your own review");
            }

            reviewRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserEmail = authentication.getName();

        return userRepository.findByEmailIgnoreCase(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
    }

    private void enrichReviewsWithUserNames(List<Review> reviews) {
        Set<UUID> userIds = new HashSet<>();

        for (Review review : reviews) {
            if (review.getUserId() == null) {
                continue;
            }

            try {
                userIds.add(UUID.fromString(review.getUserId()));
            } catch (IllegalArgumentException ignored) {
                // Invalid stored user id; it will fall back to anonymous below.
            }
        }

        Map<String, String> userNamesById = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(
                        user -> user.getId().toString(),
                        User::getFullName
                ));

        for (Review review : reviews) {
            review.setUserName(userNamesById.getOrDefault(review.getUserId(), "Anonymous User"));
        }
    }
}
