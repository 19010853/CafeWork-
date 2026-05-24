package cafework.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;
import cafework.model.Coupon;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    List<Coupon> findByCafeId(UUID cafeId);
}
