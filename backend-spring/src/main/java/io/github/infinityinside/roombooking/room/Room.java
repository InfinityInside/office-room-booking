package io.github.infinityinside.roombooking.room;

import io.github.infinityinside.roombooking.equipment.EquipmentType;
import io.github.infinityinside.roombooking.grant.AccessGrant;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "room")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private int floor;
    private int capacity;
    private String description;
    private boolean active;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "room_equipment",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "equipment_type_id"))
    private Set<EquipmentType> equipment = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "room_grant",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "grant_id"))
    private Set<AccessGrant> requiredGrants = new HashSet<>();

    /** For JPA only. */
    protected Room() {
    }

    public Room(String name, int floor, int capacity, String description) {
        this.name = name;
        this.floor = floor;
        this.capacity = capacity;
        this.description = description;
        this.active = true;
    }

    /** Replaces all editable details, as the admin form's PUT does. */
    public void update(
            String name,
            int floor,
            int capacity,
            String description,
            boolean active,
            Set<EquipmentType> equipment,
            Set<AccessGrant> requiredGrants) {
        this.name = name;
        this.floor = floor;
        this.capacity = capacity;
        this.description = description;
        this.active = active;
        this.equipment.clear();
        this.equipment.addAll(equipment);
        this.requiredGrants.clear();
        this.requiredGrants.addAll(requiredGrants);
    }

    /** Restricted rooms can only be booked by holders of one of their grants (or admins). */
    public boolean isRestricted() {
        return !requiredGrants.isEmpty();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getFloor() {
        return floor;
    }

    public int getCapacity() {
        return capacity;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public Set<EquipmentType> getEquipment() {
        return Collections.unmodifiableSet(equipment);
    }

    public Set<AccessGrant> getRequiredGrants() {
        return Collections.unmodifiableSet(requiredGrants);
    }
}