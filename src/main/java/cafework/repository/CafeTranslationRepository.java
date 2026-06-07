package cafework.repository;

import cafework.model.CafeTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CafeTranslationRepository extends JpaRepository<CafeTranslation, UUID> {
    Optional<CafeTranslation> findByCafeIdAndLang(UUID cafeId, String lang);

    List<CafeTranslation> findByLang(String lang);
}
