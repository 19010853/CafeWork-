package cafework.service;

import cafework.dto.request.CouponRequest;
import cafework.dto.response.CouponResponse;

import java.util.List;
import java.util.UUID;

public interface CouponService {

    CouponResponse createCoupon(CouponRequest request);

    List<CouponResponse> getMyCoupons();

    void deleteCoupon(UUID couponId);
    List<CouponResponse> getCouponsByCafe(UUID cafeId);
}