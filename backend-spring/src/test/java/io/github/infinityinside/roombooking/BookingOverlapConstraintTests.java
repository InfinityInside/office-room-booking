package io.github.infinityinside.roombooking;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/** Proves the database itself prevents double bookings, whatever any backend does. */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
class BookingOverlapConstraintTests {

    @Autowired
    private JdbcTemplate jdbc;

    private long roomId;
    private long userId;

    @BeforeEach
    void createRoomAndUser() {
        // Tests share one database, so each test starts from a clean state.
        jdbc.update("DELETE FROM booking");
        jdbc.update("DELETE FROM room");
        jdbc.update("DELETE FROM app_user");

        userId = jdbc.queryForObject("""
                INSERT INTO app_user (first_name, last_name, email, password_hash)
                VALUES ('Test', 'User', 'test@office.test', 'not-a-real-hash')
                RETURNING id
                """, Long.class);

        roomId = jdbc.queryForObject("""
                INSERT INTO room (name, floor, capacity)
                VALUES ('Test room', 1, 4)
                RETURNING id
                """, Long.class);
    }

    private void book(String title, String start, String end) {
        jdbc.update("""
                INSERT INTO booking (room_id, user_id, title, start_time, end_time)
                VALUES (?, ?, ?, ?::timestamptz, ?::timestamptz)
                """, roomId, userId, title, start, end);
    }

    @Test
    void rejectsOverlappingConfirmedBookings() {
        book("First", "2026-11-23T09:00:00+01:00", "2026-11-23T10:00:00+01:00");

        assertThatThrownBy(() -> book("Overlap", "2026-11-23T09:30:00+01:00", "2026-11-23T10:30:00+01:00"))
                .isInstanceOf(DataIntegrityViolationException.class)
                .hasMessageContaining("booking_no_overlap");
    }

    @Test
    void allowsBackToBackBookings() {
        book("First", "2026-11-23T09:00:00+01:00", "2026-11-23T10:00:00+01:00");

        assertThatCode(() -> book("Next", "2026-11-23T10:00:00+01:00", "2026-11-23T11:00:00+01:00"))
                .doesNotThrowAnyException();
    }

    @Test
    void cancelledBookingsDoNotBlockTheRoom() {
        book("First", "2026-11-23T09:00:00+01:00", "2026-11-23T10:00:00+01:00");
        jdbc.update("UPDATE booking SET status = 'CANCELLED', cancelled_at = now() WHERE title = 'First'");

        assertThatCode(() -> book("Rebooked", "2026-11-23T09:00:00+01:00", "2026-11-23T10:00:00+01:00"))
                .doesNotThrowAnyException();
    }
}