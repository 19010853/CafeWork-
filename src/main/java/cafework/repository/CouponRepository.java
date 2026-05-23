package cafework.repository;

import cafework.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, String> {

    List<Coupon> findByCafeId(UUID cafeId);
}