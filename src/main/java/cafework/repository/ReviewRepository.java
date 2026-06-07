package cafework.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import cafework.model.Review;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findAllByOrderByCreatedAtDesc();
    List<Review> findByCafeIdOrderByCreatedAtDesc(String cafeId);
}
