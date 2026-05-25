CREATE TABLE seats (
    id UUID PRIMARY KEY,
    cafe_id UUID NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

--fake data for seats
INSERT INTO seats (id, cafe_id, seat_number, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),          -- Tự động tạo ID độc nhất cho mỗi chiếc ghế
    c.cafe_id::uuid,            -- Lấy ID của quán cafe
    s.seat_num::varchar,        -- Đánh số ghế (từ 1 đến 30)
    'AVAILABLE',                -- Trạng thái mặc định là Trống
    CURRENT_TIMESTAMP,          -- Thời gian tạo
    CURRENT_TIMESTAMP           -- Thời gian cập nhật
FROM 
    (VALUES 
        ('30000000-0000-0000-0000-000000000001'),
        ('30000000-0000-0000-0000-000000000002'),
        ('30000000-0000-0000-0000-000000000003'),
        ('30000000-0000-0000-0000-000000000004'),
        ('30000000-0000-0000-0000-000000000005'),
        ('30000000-0000-0000-0000-000000000006'),
        ('30000000-0000-0000-0000-000000000007'),
        ('30000000-0000-0000-0000-000000000008'),
        ('30000000-0000-0000-0000-000000000009'),
        ('30000000-0000-0000-0000-000000000010')
    ) AS c(cafe_id)
CROSS JOIN 
    generate_series(1, 30) AS s(seat_num); -- Phép thuật nhân bản 30 lần