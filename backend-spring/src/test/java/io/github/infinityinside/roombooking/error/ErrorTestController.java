package io.github.infinityinside.roombooking.error;

import io.github.infinityinside.roombooking.equipment.EquipmentType;
import io.github.infinityinside.roombooking.equipment.EquipmentTypeRepository;
import io.github.infinityinside.roombooking.room.Room;
import io.github.infinityinside.roombooking.room.RoomRepository;
import jakarta.persistence.EntityManager;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Produces each kind of error on demand, to test ApiExceptionHandler. Exists only in tests. */
@RestController
@RequestMapping("/test/errors")
class ErrorTestController {

    record SampleRequest(@NotBlank @Size(max = 10) String name, @NotNull @Min(1) Integer capacity) {
    }

    private final EquipmentTypeRepository equipmentTypes;
    private final RoomRepository rooms;
    private final EntityManager entityManager;

    ErrorTestController(EquipmentTypeRepository equipmentTypes, RoomRepository rooms, EntityManager entityManager) {
        this.equipmentTypes = equipmentTypes;
        this.rooms = rooms;
        this.entityManager = entityManager;
    }

    @PostMapping("/validated")
    void validated(@Valid @RequestBody SampleRequest request) {
    }

    @GetMapping("/not-found")
    void notFound() {
        throw NotFoundException.of("Room", 42);
    }

    @GetMapping("/conflict")
    void conflict() {
        throw new ConflictException("This code is already taken.");
    }

    @GetMapping("/unexpected")
    void unexpected() {
        throw new IllegalStateException("secret internal detail");
    }

    @PostMapping("/duplicate-equipment-code")
    void duplicateEquipmentCode() {
        equipmentTypes.save(new EquipmentType("DUPLICATE", "First"));
        equipmentTypes.save(new EquipmentType("DUPLICATE", "Second"));
    }

    @PostMapping("/delete-equipment-in-use")
    void deleteEquipmentInUse() {
        EquipmentType tv = equipmentTypes.save(new EquipmentType("TEST_TV", "Test TV"));
        Room room = new Room("Test room", 1, 4, "");
        room.update("Test room", 1, 4, "", true, Set.of(tv), Set.of());
        rooms.saveAndFlush(room);

        // Forget everything, as if the delete came in a later request that only loads the equipment type.
        entityManager.clear();

        equipmentTypes.deleteById(tv.getId());
        equipmentTypes.flush();
    }
}