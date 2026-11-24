package io.github.infinityinside.roombooking.equipment;

import java.util.List;

import io.github.infinityinside.roombooking.error.ConflictException;
import io.github.infinityinside.roombooking.error.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentTypeService {

    private final EquipmentTypeRepository equipmentTypes;

    public EquipmentTypeService(EquipmentTypeRepository equipmentTypes) {
        this.equipmentTypes = equipmentTypes;
    }

    @Transactional(readOnly = true)
    public List<EquipmentType> listAll() {
        return equipmentTypes.findAllByOrderByNameAsc();
    }

    @Transactional
    public EquipmentType create(String code, String name) {
        String trimmedName = name.strip();
        if (equipmentTypes.existsByCode(code)) {
            throw new ConflictException("An equipment type with the code %s already exists.".formatted(code));
        }
        if (equipmentTypes.existsByNameIgnoringCase(trimmedName)) {
            throw new ConflictException("An equipment type named %s already exists.".formatted(trimmedName));
        }
        return equipmentTypes.save(new EquipmentType(code, trimmedName));
    }

    @Transactional
    public EquipmentType rename(Long id, String name) {
        EquipmentType type = findOrThrow(id);
        String trimmedName = name.strip();
        if (equipmentTypes.existsByNameIgnoringCaseExcept(trimmedName, id)) {
            throw new ConflictException("An equipment type named %s already exists.".formatted(trimmedName));
        }
        type.rename(trimmedName);
        equipmentTypes.flush();
        return type;
    }

    @Transactional
    public void delete(Long id) {
        EquipmentType type = findOrThrow(id);
        long roomCount = equipmentTypes.countRoomsUsing(id);
        if (roomCount > 0) {
            throw new ConflictException("%s is still assigned to %d %s.".formatted(
                    type.getName(), roomCount, roomCount == 1 ? "room" : "rooms"));
        }
        equipmentTypes.delete(type);
        equipmentTypes.flush();
    }

    private EquipmentType findOrThrow(Long id) {
        return equipmentTypes.findById(id).orElseThrow(() -> NotFoundException.of("Equipment type", id));
    }
}