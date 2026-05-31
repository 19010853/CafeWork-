package cafework.service.impl;

import cafework.dto.request.CouponRequest;
import cafework.dto.response.CouponResponse;
import cafework.model.Cafe;
import cafework.model.Coupon;
import cafework.model.User;
import cafework.repository.CafeRepository;
import cafework.repository.CouponRepository;
import cafework.repository.UserRepository;
import cafework.service.CouponService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final CafeRepository cafeRepository;

    public CouponServiceImpl(
            CouponRepository couponRepository,
            UserRepository userRepository,
            CafeRepository cafeRepository
    ) {
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
        this.cafeRepository = cafeRepository;
    }

    @Override
    public CouponResponse createCoupon(CouponRequest request) {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cafe cafe = cafeRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new RuntimeException("Cafe not found"));

        Coupon coupon = new Coupon();

        coupon.setCafeId(cafe.getId());
        coupon.setCode(request.getCode());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setValidFrom(request.getValidFrom());
        coupon.setValidTo(request.getValidTo());
        coupon.setCreatedAt(LocalDateTime.now());

        Coupon savedCoupon = couponRepository.save(coupon);

        return mapToResponse(savedCoupon);
    }

    @Override
    public List<CouponResponse> getMyCoupons() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        User owner = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cafe cafe = cafeRepository.findByOwnerId(owner.getId())
                .orElseThrow(() -> new RuntimeException("Cafe not found"));

        return couponRepository.findByCafeId(cafe.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteCoupon(String couponId) {

        if (!couponRepository.existsById(couponId)) {
            throw new RuntimeException("Coupon not found");
        }

        couponRepository.deleteById(couponId);
    }
    @Override
    public List<CouponResponse> getCouponsByCafe(UUID cafeId) {
        return couponRepository.findByCafeId(cafeId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private CouponResponse mapToResponse(Coupon coupon) {

        CouponResponse response = new CouponResponse();

        response.setId(coupon.getId());
        response.setCode(coupon.getCode());
        response.setDescription(coupon.getDescription());
        response.setDiscountValue(coupon.getDiscountValue());
        response.setValidFrom(coupon.getValidFrom());
        response.setValidTo(coupon.getValidTo());

        LocalDate today = LocalDate.now();

        boolean active =
                LocalDateTime.now().isAfter(coupon.getValidFrom())
                        && LocalDateTime.now().isBefore(coupon.getValidTo());

        response.setActive(active);

        return response;
    }
}