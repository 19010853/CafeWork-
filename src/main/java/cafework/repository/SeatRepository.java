package cafework.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import cafework.model.Seat;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
@Repository
public interface  SeatRepository extends JpaRepository<Seat, UUID>{
    Optional<Seat> findByCafeIdAndSeatNumber(UUID cafeId, int seatNumber);
    List<Seat> findByCafeIdOrderBySeatNumberAsc(UUID cafeId);
}
