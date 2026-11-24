package io.github.infinityinside.roombooking.booking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.github.infinityinside.roombooking.IntegrationTest;
import io.github.infinityinside.roombooking.equipment.EquipmentType;
import io.github.infinityinside.roombooking.equipment.EquipmentTypeRepository;
import io.github.infinityinside.roombooking.grant.AccessGrant;
import io.github.infinityinside.roombooking.grant.AccessGrantRepository;
import io.github.infinityinside.roombooking.grant.GrantType;
import io.github.infinityinside.roombooking.room.Room;
import io.github.infinityinside.roombooking.room.RoomRepository;
import io.github.infinityinside.roombooking.user.AppUser;
import io.github.infinityinside.roombooking.user.AppUserRepository;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

/** Saves and reloads entities, to prove the mappings match the real schema. */
@IntegrationTest
@Transactional
class BookingMappingTests {

    @Autowired private AppUserRepository users;
    @Autowired private AccessGrantRepository grants;
    @Autowired private EquipmentTypeRepository equipmentTypes;
    @Autowired private RoomRepository rooms;
    @Autowired private BookingRepository bookings;
    @Autowired private EntityManager entityManager;

    private static final Instant START = Instant.parse("2030-01-10T08:00:00Z");
    private static final Instant END = Instant.parse("2030-01-10T09:00:00Z");

    @Test
    void savesAndLoadsABookingWithItsRoomAndUser() {
        AccessGrant it = grants.save(new AccessGrant("IT", "IT", GrantType.ROOM_ACCESS, ""));
        EquipmentType projector = equipmentTypes.save(new EquipmentType("PROJECTOR", "Projector"));

        Room room = new Room("Aurora", 1, 6, "By the kitchen.");
        room.update("Aurora", 1, 6, "By the kitchen.", true, Set.of(projector), Set.of(it));
        rooms.save(room);

        AppUser user = users.save(new AppUser("Ivy", "Tech", "Ivy@Office.test", "hash", START));
        user.addGrant(it);

        Long bookingId = bookings.save(new Booking(room, user, "Sprint review", "", START, END, START)).getId();

        // Write everything to the database, then forget it, so the next read really comes from PostgreSQL.
        entityManager.flush();
        entityManager.clear();

        Booking loaded = bookings.findById(bookingId).orElseThrow();
        assertThat(loaded.getTitle()).isEqualTo("Sprint review");
        assertThat(loaded.getStatus()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(loaded.getStartTime()).isEqualTo(START);
        assertThat(loaded.getRoom().getName()).isEqualTo("Aurora");
        assertThat(loaded.getRoom().isRestricted()).isTrue();
        assertThat(loaded.getRoom().getEquipment()).extracting(EquipmentType::getCode).containsExactly("PROJECTOR");
        assertThat(loaded.getUser().getGrants()).extracting(AccessGrant::getCode).containsExactly("IT");
    }

    @Test
    void findsUsersByEmailIgnoringCase() {
        users.save(new AppUser("Tom", "Novak", "Tom@Office.test", "hash", START));

        assertThat(users.findByEmail("tom@office.TEST")).isPresent();
        assertThat(users.existsByEmail("TOM@OFFICE.TEST")).isTrue();
        assertThat(users.existsByEmail("nobody@office.test")).isFalse();
    }

    @Test
    void cancelsOnlyBeforeTheStart() {
        Room room = rooms.save(new Room("Cosmos", 2, 4, ""));
        AppUser user = users.save(new AppUser("Tom", "Novak", "tom@office.test", "hash", START));
        Booking booking = new Booking(room, user, "Standup", "", START, END, START);

        assertThatThrownBy(() -> booking.cancel(START)).isInstanceOf(IllegalStateException.class);

        booking.cancel(START.minusSeconds(60));
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(booking.getCancelledAt()).isEqualTo(START.minusSeconds(60));
    }
}