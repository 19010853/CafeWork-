package cafework.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;
import cafework.model.Coupon;
import cafework.repository.CouponRepository;


@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @GetMapping
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @GetMapping("/{id}")
    public Coupon getCouponById(@PathVariable UUID id) {
        return couponRepository.findById(id).orElse(null);
    }

    @PostMapping
    public Coupon createCoupon(@RequestBody Coupon coupon) {
        return couponRepository.save(coupon);
    }

    @PutMapping("/{id}")
    public Coupon updateCoupon(@PathVariable UUID id, @RequestBody Coupon coupon) {
        coupon.setId(id);
        return couponRepository.save(coupon);
    }

    @DeleteMapping("/{id}")
    public void deleteCoupon(@PathVariable UUID id) {
        couponRepository.deleteById(id);
    }

    @GetMapping("cafe/{cafeId}")
    public List<Coupon> getCouponsByCafe(@PathVariable UUID cafeId) {
        return couponRepository.findByCafeId(cafeId);
    }
    
}
