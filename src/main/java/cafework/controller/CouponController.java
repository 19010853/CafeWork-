package cafework.controller;

import cafework.dto.request.CouponRequest;
import cafework.dto.response.CouponResponse;
import cafework.service.CouponService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponService couponService;

    @GetMapping("/my-coupons")
    public List<CouponResponse> getMyCoupons() {
        return couponService.getMyCoupons();
    }

    @GetMapping("/cafe/{cafeId}")
    public List<CouponResponse> getCouponsByCafe(
            @PathVariable UUID cafeId
    ) {
        return couponService.getCouponsByCafe(cafeId);
    }

    @PostMapping
    public CouponResponse createCoupon(@RequestBody CouponRequest request) {
        return couponService.createCoupon(request);
    }

    @DeleteMapping("/{id}")
    public void deleteCoupon(@PathVariable String id) {
        couponService.deleteCoupon(id);
    }
}