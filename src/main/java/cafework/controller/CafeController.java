package cafework.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import cafework.dto.SeatStatusUpdateRequest;
import cafework.dto.SeatStatusUpdateResponse;
import cafework.dto.request.CafeRequest;
import cafework.model.Cafe;
import cafework.model.CafeImage;
import cafework.model.Coupon;
import cafework.model.Seat;
import cafework.model.User;
import cafework.repository.UserRepository;
import cafework.service.CafeService;
import cafework.repository.SeatRepository;
import cafework.repository.CafeRepository;
import cafework.repository.CouponRepository;
import cafework.repository.CafeImageRepository;

@RestController
@RequestMapping("/api/cafes")
public class CafeController {

    @Autowired
    private CafeService cafeService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private CafeImageRepository cafeImageRepository;

    @Autowired
    private CouponRepository couponRepository;
    @GetMapping
    public List<Cafe> getAllCafes() {
        // Keeping as is, but ensuring service handles it
        return cafeService.searchByName("");
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cafe> getCafeById(@PathVariable UUID id) {
        Cafe cafe = cafeService.getCafeDetailsById(id);
        if (cafe != null) {
            return ResponseEntity.ok(cafe);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Cafe>> searchCafes(@RequestParam(value = "keyword", required = false, defaultValue = "") String keyword) {
        List<Cafe> results = cafeService.searchByName(keyword);
        return ResponseEntity.ok(results);
    }

    @PatchMapping("/{id}/seat-status")
    public ResponseEntity<?> updateSeatStatus(@PathVariable UUID id, @RequestBody SeatStatusUpdateRequest request) {
        try {
            SeatStatusUpdateResponse response = cafeService.updateSeatStatus(id, request);
            if (response == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("System error: " + e.getMessage());
        }
    }

    // === FEATURE 11b: MY CAFE MANAGEMENT ===

    @GetMapping("/my-cafe")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> getMyCafe() {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new Exception("User not found"));
            
            Cafe cafe = cafeService.getCafeByOwnerId(user.getId());
            if (cafe == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(cafe);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> createMyCafe(@RequestBody CafeRequest request) {
        try {
            // Lấy email từ lệnh bài bảo mật Token
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new Exception("User not found"));
            
            // Phái binh sang tầng Service thực hiện chiêu thức đúc thực thể Cafe mới
            Cafe newCafe = cafeService.createCafe(user.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(newCafe);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("System error: " + e.getMessage());
        }
    }

    @PutMapping("/my-cafe")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> updateMyCafe(@RequestBody CafeRequest request) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new Exception("User not found"));
            
            Cafe updatedCafe = cafeService.updateCafe(user.getId(), request);
            return ResponseEntity.ok(updatedCafe);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("System error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<List<Seat>> getCafeSeats(@PathVariable UUID id) {
        List<Seat> seats = seatRepository.findByCafeIdOrderBySeatNumberAsc(id);
        return ResponseEntity.ok(seats);
    }

    @PutMapping("/{id}/seats")
    @Transactional
    public ResponseEntity<?> updateCafeSeats(@PathVariable UUID id, @RequestBody List<Seat> updatedSeats) {
        Cafe cafe = cafeRepository.findById(id).orElse(null);
        if (cafe == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Cafe not found.");
        }

        List<UUID> existingSeatIds = updatedSeats.stream()
                .map(Seat::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<UUID, Seat> existingSeatsById = seatRepository.findAllById(existingSeatIds)
                .stream()
                .filter(seat -> cafe.getId().equals(seat.getCafeId()))
                .collect(Collectors.toMap(Seat::getId, Function.identity()));
        List<Seat> seatsToSave = new ArrayList<>();

        for (Seat incomingSeat : updatedSeats) {
            if (incomingSeat.getId() == null) {
                Seat newSeat = new Seat();
                newSeat.setId(UUID.randomUUID());
                newSeat.setCafeId(cafe.getId());
                newSeat.setSeatNumber(incomingSeat.getSeatNumber());
                newSeat.setStatus(incomingSeat.getStatus());
                seatsToSave.add(newSeat);
                continue;
            }

            Seat existingSeat = existingSeatsById.get(incomingSeat.getId());
            if (existingSeat != null) {
                existingSeat.setStatus(incomingSeat.getStatus());
                seatsToSave.add(existingSeat);
            }
        }

        if (!seatsToSave.isEmpty()) {
            seatRepository.saveAll(seatsToSave);
        }

        return ResponseEntity.ok(seatRepository.findByCafeIdOrderBySeatNumberAsc(id));
    }

    @PostMapping("/{id}/seats/batch-delete")
    @Transactional
    public ResponseEntity<?> batchDeleteSeats(@PathVariable UUID id, @RequestBody List<UUID> seatIds) {
        try {
            if (seatIds == null || seatIds.isEmpty()) {
                return ResponseEntity.ok().build();
            }

            List<Seat> seatsToDelete = seatRepository.findAllById(seatIds)
                    .stream()
                    .filter(seat -> id.equals(seat.getCafeId()))
                    .toList();
            seatRepository.deleteAllInBatch(seatsToDelete);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete seats: " + e.getMessage());
        }
    }

    // ==========================================
    // 👇 2. CÁC LỘ TRÌNH CHO ẢNH VÀ KHUYẾN MÃI 👇
    // ==========================================

    // Lộ trình 1: Lấy danh sách Ảnh của quán
    @GetMapping("/{id}/images")
    public ResponseEntity<?> getCafeImages(@PathVariable UUID id) {
        return ResponseEntity.ok(cafeImageRepository.findByCafeId(id));
    }

    // Lộ trình 2: Lấy danh sách Khuyến mãi
    @GetMapping("/{id}/coupons")
    public ResponseEntity<?> getCafeCoupons(@PathVariable UUID id) {
        return ResponseEntity.ok(couponRepository.findByCafeId(id));
    }

    // Lộ trình 3: Tạo Khuyến mãi mới
    @PostMapping("/{id}/coupons")
    public ResponseEntity<?> addCoupon(@PathVariable UUID id, @RequestBody Coupon coupon) {
        Cafe cafe = cafeRepository.findById(id).orElse(null);
        if (cafe == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy quán cafe!");
        }
        
        coupon.setCafeId(cafe.getId());
        Coupon savedCoupon = couponRepository.save(coupon);
        return ResponseEntity.ok(savedCoupon);
    }

    // Lộ trình 4: Xóa Khuyến mãi
    @DeleteMapping("/{cafeId}/coupons/{couponId}")
    public ResponseEntity<?> deleteCoupon(@PathVariable UUID cafeId, @PathVariable UUID couponId) {
        if (couponRepository.existsById(couponId)) {
            couponRepository.deleteById(couponId);
            return ResponseEntity.ok().body("Đã hủy vé khuyến mãi thành công!");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy vé này!");
    }

    // Lộ trình lưu đường link ảnh vào DB
    @PostMapping("/{id}/images")
    public ResponseEntity<?> addCafeImage(@PathVariable UUID id, @RequestBody CafeImage imageRequest) {
        try {
            Cafe cafe = cafeRepository.findById(id).orElse(null);
            if (cafe == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Không tìm thấy quán cafe!");
            }
            
            // Ép thẻ quán cafe vào bức ảnh
            imageRequest.setCafeId(cafe.getId());
            
            // Lưu xuống Database
            CafeImage savedImage = cafeImageRepository.save(imageRequest);
            return ResponseEntity.ok(savedImage);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi: " + e.getMessage());
        }
    }
    // Lộ trình trảm ảnh: Xóa ảnh khỏi Database
    @DeleteMapping("/{cafeId}/images/{imageId}")
    public ResponseEntity<?> deleteCafeImage(@PathVariable UUID cafeId, @PathVariable UUID imageId) {
        try {
            if (cafeImageRepository.existsById(imageId)) {
                cafeImageRepository.deleteById(imageId);
                return ResponseEntity.ok().body("Đã thiêu rụi bức ảnh thành công!");
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bẩm, không tìm thấy bức ảnh này!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Lỗi khi xóa ảnh: " + e.getMessage());
        }
    }
}
