package cafework.repository;

import cafework.model.CafeImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CafeImageRepository extends JpaRepository<CafeImage, UUID> {
    // Lệnh tìm tất cả ảnh của một quán
    List<CafeImage> findByCafeId(UUID cafeId);
}