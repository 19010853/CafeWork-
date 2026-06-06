CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY,
    cafe_id UUID NOT NULL,
    seat_number INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cafe FOREIGN KEY (cafe_id) REFERENCES cafes(id) ON DELETE CASCADE
);

ALTER TABLE seats
    ALTER COLUMN seat_number TYPE INTEGER USING seat_number::integer;

INSERT INTO seats (id, cafe_id, seat_number, status, created_at, updated_at)
SELECT
    gen_random_uuid(),
    cafe_ids.id::uuid,
    seat_nums.seat_number,
    'AVAILABLE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
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
    ) AS cafe_ids(id)
CROSS JOIN
    generate_series(1, 30) AS seat_nums(seat_number)
WHERE EXISTS (
    SELECT 1
    FROM cafes
    WHERE cafes.id = cafe_ids.id::uuid
)
AND NOT EXISTS (
    SELECT 1
    FROM seats
    WHERE seats.cafe_id = cafe_ids.id::uuid
      AND seats.seat_number = seat_nums.seat_number
);
