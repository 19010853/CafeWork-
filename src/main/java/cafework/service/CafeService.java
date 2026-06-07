package cafework.service;

import cafework.dto.SeatStatusUpdateRequest;
import cafework.dto.SeatStatusUpdateResponse;
import cafework.dto.request.CafeRequest;
import cafework.model.Cafe;

import java.util.List;
import java.util.UUID;

public interface CafeService {
    List<Cafe> searchByName(String keyword);
    List<Cafe> searchByName(String keyword, String lang);
    List<Cafe> searchByName(String keyword, String lang, boolean recordHistory);
    Cafe getCafeDetailsById(UUID id);
    Cafe getCafeDetailsById(UUID id, String lang);
    int warmupTranslations(String lang);
    SeatStatusUpdateResponse updateSeatStatus(UUID cafeId, SeatStatusUpdateRequest request);
    
    // Feature 11b
    Cafe getCafeByOwnerId(UUID ownerId);
    Cafe updateCafe(UUID ownerId, CafeRequest request);
    Cafe createCafe(UUID ownerId, CafeRequest request);
}
