package io.github.infinityinside.roombooking.equipment;

import java.util.List;
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
}