package cafework.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import cafework.dto.SeatStatusUpdateRequest;
import cafework.dto.SeatStatusUpdateResponse;
import cafework.dto.request.CafeRequest;
import cafework.model.Cafe;
import cafework.model.Seat;
import cafework.model.User;
import cafework.repository.UserRepository;
import cafework.service.CafeService;
import cafework.repository.SeatRepository;

@RestController
@RequestMapping("/api/cafes")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class CafeController {

    @Autowired
    private CafeService cafeService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SeatRepository seatRepository;

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
}
