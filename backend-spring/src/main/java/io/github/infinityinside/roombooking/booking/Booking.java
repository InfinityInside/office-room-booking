package io.github.infinityinside.roombooking.booking;

import io.github.infinityinside.roombooking.room.Room;
import io.github.infinityinside.roombooking.user.AppUser;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private AppUser user;

    private String title;
    private String description;
    private Instant startTime;
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private Instant createdAt;
    private Instant cancelledAt;

    /** For JPA only. */
    protected Booking() {
    }

    public Booking(Room room, AppUser user, String title, String description,
                   Instant startTime, Instant endTime, Instant createdAt) {
        this.room = room;
        this.user = user;
        this.title = title;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.createdAt = createdAt;
        this.status = BookingStatus.CONFIRMED;
    }

    /** A booking can only be cancelled while it's confirmed and hasn't started yet. */
    public void cancel(Instant now) {
        if (status == BookingStatus.CANCELLED) {
            throw new IllegalStateException("This booking is already cancelled.");
        }
        if (!startTime.isAfter(now)) {
            throw new IllegalStateException("Bookings that have started cannot be cancelled.");
        }
        this.status = BookingStatus.CANCELLED;
        this.cancelledAt = now;
    }

    public Long getId() {
        return id;
    }

    public Room getRoom() {
        return room;
    }

    public AppUser getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }
}